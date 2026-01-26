import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Submission, SubmissionDocument, AnswerOption } from "./submission.schema";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";
import { AssignmentsService } from "../assignments/assigment.service";

import { Activity } from "../activities/activity.schema";

type AssignmentRaw = {
  _id: Types.ObjectId;
  activityId: Types.ObjectId;
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  status?: string;
  dueAt?: Date;
  submissionId?: Types.ObjectId;
};

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,

    @InjectModel(Activity.name)
    private readonly activityModel: Model<any>,

    private readonly assignmentsService: AssignmentsService,
  ) {}

  /**
   * ALUNO envia respostas para um assignment
   * - calcula score/total
   * - calcula percent
   * - calcula needsReinforcement com base no threshold da Activity
   * - salva submission (1 por assignment)
   * - marca assignment como SUBMITTED
   */
  async submitAssignment(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    // Busca o assignment na collection diretamente (evita depender do schema/path)
    const rawAssignment = (await this.submissionModel.db
      .collection("assignments")
      .findOne({ _id: new Types.ObjectId(assignmentId) })) as AssignmentRaw | null;

    if (!rawAssignment) throw new NotFoundException("Atribuição não encontrada.");
    if (rawAssignment.studentId.toString() !== studentId) throw new ForbiddenException("Acesso negado.");

    // Busca a atividade completa (com respostaCerta) para corrigir
    const activity = await this.activityModel.findById(rawAssignment.activityId).lean();
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    const total = Array.isArray(activity.questionario) ? activity.questionario.length : 0;

    let score = 0;
    for (let i = 0; i < total; i++) {
      const correct = activity.questionario?.[i]?.respostaCerta;
      const ans = dto.answers?.[String(i)];
      if (ans && correct && String(ans).toUpperCase() === String(correct).toUpperCase()) score++;
    }

    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    const threshold =
      typeof activity.minPercentToNoReinforcement === "number"
        ? activity.minPercentToNoReinforcement
        : 70;

    const needsReinforcement = percent < threshold;

    // Cria submission (uma por assignment)
    let created: any;
    try {
      created = await this.submissionModel.create({
        assignmentId: new Types.ObjectId(assignmentId),
        activityId: rawAssignment.activityId,
        studentId: rawAssignment.studentId,
        teacherId: rawAssignment.teacherId,
        answers: dto.answers as Record<string, AnswerOption>,
        score,
        total,
        percent,
        needsReinforcement,
      });
    } catch (e: any) {
      // índice unique em assignmentId
      if (e?.code === 11000) throw new ForbiddenException("Esta atividade já foi enviada.");
      throw e;
    }

    // Marca assignment como submitted
    await this.assignmentsService.markSubmitted(assignmentId, created._id.toString());

    return {
      id: created._id.toString(),
      assignmentId,
      submitted: true,
      score,
      total,
      percent,
      threshold,
      needsReinforcement,
      createdAt: (created as any).createdAt ?? null,
    };
  }

  /**
   * PROFESSOR: lista submissions (dashboard)
   * - retorna nome/email do aluno e descricao da atividade
   * - taxa de acerto e needsReinforcement (já salvo)
   */
  async teacherListSubmissions(teacherId: string) {
    const subs = await this.submissionModel
      .find({ teacherId: new Types.ObjectId(teacherId) })
      .sort({ _id: -1 })
      .populate({ path: "studentId", select: "nome email" })
      .populate({ path: "activityId", select: "descricao minPercentToNoReinforcement" })
      .lean();

    return subs.map((s: any) => ({
      id: s._id.toString(),
      assignmentId: s.assignmentId.toString(),
      createdAt: s.createdAt ?? null,

      student: s.studentId
        ? { id: s.studentId._id.toString(), nome: s.studentId.nome, email: s.studentId.email }
        : { id: s.studentId?.toString?.() ?? "", nome: "—", email: "—" },

      activity: s.activityId
        ? {
            id: s.activityId._id.toString(),
            descricao: s.activityId.descricao,
            threshold: s.activityId.minPercentToNoReinforcement ?? 70,
          }
        : { id: s.activityId?.toString?.() ?? "", descricao: "—", threshold: 70 },

      score: s.score ?? null,
      total: s.total ?? null,
      percent: s.percent ?? (s.total ? Math.round((s.score / s.total) * 100) : null),
      needsReinforcement: typeof s.needsReinforcement === "boolean" ? s.needsReinforcement : null,
    }));
  }

  /**
   * PROFESSOR: pega a submission de um assignment específico
   * - valida que o assignment pertence ao professor
   */
  async teacherGetSubmissionByAssignment(assignmentId: string, teacherId: string) {
    // garante ownership do assignment
    await this.assignmentsService.getAssignmentForTeacherOrThrow(assignmentId, teacherId);

    const sub = await this.submissionModel
      .findOne({ assignmentId: new Types.ObjectId(assignmentId) })
      .populate({ path: "studentId", select: "nome email" })
      .populate({ path: "activityId", select: "descricao minPercentToNoReinforcement" })
      .lean();

    if (!sub) throw new NotFoundException("Nenhuma resposta encontrada para esta atribuição.");

    return {
      id: (sub as any)._id.toString(),
      assignmentId: (sub as any).assignmentId.toString(),
      createdAt: (sub as any).createdAt ?? null,

      student: (sub as any).studentId
        ? {
            id: (sub as any).studentId._id.toString(),
            nome: (sub as any).studentId.nome,
            email: (sub as any).studentId.email,
          }
        : null,

      activity: (sub as any).activityId
        ? {
            id: (sub as any).activityId._id.toString(),
            descricao: (sub as any).activityId.descricao,
            threshold: (sub as any).activityId.minPercentToNoReinforcement ?? 70,
          }
        : null,

      answers: (sub as any).answers,
      score: (sub as any).score ?? null,
      total: (sub as any).total ?? null,
      percent:
        (sub as any).percent ??
        ((sub as any).total ? Math.round(((sub as any).score / (sub as any).total) * 100) : null),

      needsReinforcement:
        typeof (sub as any).needsReinforcement === "boolean" ? (sub as any).needsReinforcement : null,
    };
  }
}
