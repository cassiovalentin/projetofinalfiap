import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Submission, SubmissionDocument } from "./submission.schema";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";
import { AssignmentsService } from "../assignments/assigment.service";
import { InjectModel as InjectMongooseModel } from "@nestjs/mongoose";
import { Activity } from "../activities/activity.schema"; // ajuste caminho

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,

    private readonly assignmentsService: AssignmentsService,

    @InjectMongooseModel(Activity.name)
    private readonly activityModel: Model<any>,
  ) {}

  // ALUNO envia respostas
  async submitAssignment(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.assignmentsService.getMyAssignmentById(assignmentId, studentId);

    // Precisamos do assignment completo (teacherId/activityId) para salvar
    const rawAssignment = await this.submissionModel.db
      .collection("assignments")
      .findOne({ _id: new Types.ObjectId(assignmentId) });

    if (!rawAssignment) throw new NotFoundException("Atribuição não encontrada.");
    if (rawAssignment.studentId.toString() !== studentId) throw new ForbiddenException("Acesso negado.");

    // Correção automática opcional
    const activity = await this.activityModel.findById(rawAssignment.activityId).lean();
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    const total = Array.isArray(activity.questionario) ? activity.questionario.length : 0;
    let score = 0;

    for (let i = 0; i < total; i++) {
      const correct = activity.questionario[i]?.respostaCerta;
      const ans = dto.answers[String(i)];
      if (ans && correct && String(ans).toUpperCase() === String(correct).toUpperCase()) score++;
    }

    // Cria submission (uma por assignment)
    let created: any;
    try {
      created = await this.submissionModel.create({
        assignmentId: new Types.ObjectId(assignmentId),
        activityId: rawAssignment.activityId,
        studentId: rawAssignment.studentId,
        teacherId: rawAssignment.teacherId,
        answers: dto.answers,
        score,
        total,
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        // já submetida
        throw new ForbiddenException("Esta atividade já foi enviada.");
      }
      throw e;
    }

    // marca assignment como submitted
    await this.assignmentsService.markSubmitted(assignmentId, created._id.toString());

    return {
      id: created._id.toString(),
      assignmentId,
      submitted: true,
      score,
      total,
    };
  }

  // PROFESSOR: listar submissions (dashboard)
  async teacherListSubmissions(teacherId: string) {
    const subs = await this.submissionModel
      .find({ teacherId: new Types.ObjectId(teacherId) })
      .sort({ _id: -1 })
      .lean();

    return subs.map((s) => ({
      id: s._id.toString(),
      assignmentId: s.assignmentId.toString(),
      activityId: s.activityId.toString(),
      studentId: s.studentId.toString(),
      score: s.score,
      total: s.total,
      answers: s.answers,
      createdAt: (s as any).createdAt,
    }));
  }

  // PROFESSOR: ver submission de um assignment específico
  async teacherGetSubmissionByAssignment(assignmentId: string, teacherId: string) {
    // garante que o assignment pertence ao professor
    await this.assignmentsService.getAssignmentForTeacherOrThrow(assignmentId, teacherId);

    const sub = await this.submissionModel.findOne({ assignmentId: new Types.ObjectId(assignmentId) }).lean();
    if (!sub) throw new NotFoundException("Nenhuma resposta encontrada para esta atribuição.");

    return {
      id: sub._id.toString(),
      assignmentId: sub.assignmentId.toString(),
      activityId: sub.activityId.toString(),
      studentId: sub.studentId.toString(),
      score: sub.score,
      total: sub.total,
      answers: sub.answers,
      createdAt: (sub as any).createdAt,
    };
  }
}
