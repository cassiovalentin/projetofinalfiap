import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Assignment, AssignmentDocument } from "../assignments/assigment.schema";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user-role.enum";

import { sanitizeActivityForStudent } from "../activities/activity.sanitizer";
import { Activity } from "../activities/activity.schema";

import { Submission, SubmissionDocument } from "../submissions/submission.schema";

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,

    private readonly usersService: UsersService,

    @InjectModel(Activity.name)
    private readonly activityModel: Model<any>,

    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  // =========================
  // PROFESSOR: atribuir atividade a um aluno
  // =========================
  async createAssignment(dto: CreateAssignmentDto, teacherId: string) {
    const student = await this.usersService.findOne(dto.studentId);
    if (student.role !== UserRole.ALUNO) {
      throw new ForbiddenException("A atividade só pode ser atribuída para usuário ALUNO.");
    }

    const activity = await this.activityModel.findById(dto.activityId).lean();
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    try {
      const created = await this.assignmentModel.create({
        activityId: new Types.ObjectId(dto.activityId),
        studentId: new Types.ObjectId(dto.studentId),
        teacherId: new Types.ObjectId(teacherId),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        status: "ASSIGNED",
      });

      return {
        id: created._id.toString(),
        activityId: created.activityId.toString(),
        studentId: created.studentId.toString(),
        teacherId: created.teacherId.toString(),
        status: created.status,
        dueAt: created.dueAt ?? null,
        createdAt: (created as any).createdAt ?? null,
      };
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException("Essa atividade já foi atribuída para esse aluno por você.");
      }
      throw e;
    }
  }

  // =========================
  // ALUNO: lista assignments do próprio aluno (atividade sanitizada)
  // =========================
  async listMyAssignments(studentId: string) {
    const assignments = await this.assignmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ _id: -1 })
      .lean();

    const activityIds = assignments.map((a) => a.activityId);
    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .lean();

    const map = new Map<string, any>(activities.map((a) => [a._id.toString(), a]));

    return assignments.map((a) => {
      const act = map.get(a.activityId.toString());
      return {
        assignmentId: a._id.toString(),
        status: a.status,
        dueAt: a.dueAt ?? null,
        activity: act ? sanitizeActivityForStudent(act) : null,
      };
    });
  }

  async getMyAssignmentById(assignmentId: string, studentId: string) {
    const a = await this.assignmentModel.findById(assignmentId).lean();
    if (!a) throw new NotFoundException("Atribuição não encontrada.");
    if (a.studentId.toString() !== studentId) throw new ForbiddenException("Acesso negado.");

    const activity = await this.activityModel.findById(a.activityId).lean();
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    return {
      assignmentId: a._id.toString(),
      status: a.status,
      dueAt: a.dueAt ?? null,
      activity: sanitizeActivityForStudent(activity),
    };
  }

  // =========================
  // PROFESSOR: LISTA atribuições COM nome/email do aluno + descricao da atividade
  // =========================
  async teacherListAssignments(
    teacherId: string,
    filters?: { activityId?: string; studentId?: string; status?: string },
  ) {
    const where: any = { teacherId: new Types.ObjectId(teacherId) };

    if (filters?.activityId) where.activityId = new Types.ObjectId(filters.activityId);
    if (filters?.studentId) where.studentId = new Types.ObjectId(filters.studentId);
    if (filters?.status) where.status = filters.status;

    const list = await this.assignmentModel
      .find(where)
      .sort({ _id: -1 })
      .populate({ path: "studentId", select: "nome email role" })
      .populate({ path: "activityId", select: "descricao" })
      .lean();

    return list.map((a: any) => ({
      id: a._id.toString(),
      status: a.status,
      dueAt: a.dueAt ?? null,
      createdAt: a.createdAt ?? null,
      submissionId: a.submissionId?.toString?.() ?? null,

      student: a.studentId
        ? {
            id: a.studentId._id.toString(),
            nome: a.studentId.nome,
            email: a.studentId.email,
          }
        : { id: a.studentId?.toString?.() ?? "", nome: "—", email: "—" },

      activity: a.activityId
        ? {
            id: a.activityId._id.toString(),
            descricao: a.activityId.descricao,
          }
        : { id: a.activityId?.toString?.() ?? "", descricao: "—" },
    }));
  }

  // usado por submissions para marcar submitted
  async markSubmitted(assignmentId: string, submissionId: string) {
    await this.assignmentModel.updateOne(
      { _id: new Types.ObjectId(assignmentId) },
      { $set: { status: "SUBMITTED", submissionId: new Types.ObjectId(submissionId) } },
    );
  }

  // helper: professor dono do assignment
  async getAssignmentForTeacherOrThrow(assignmentId: string, teacherId: string) {
    const a = await this.assignmentModel.findById(assignmentId).lean();
    if (!a) throw new NotFoundException("Atribuição não encontrada.");
    if (a.teacherId.toString() !== teacherId) throw new ForbiddenException("Acesso negado.");
    return a;
  }

  // =========================
  // PROFESSOR: VISÃO CONSOLIDADA (nome do aluno + desempenho + erros por tópico)
  // =========================
  async teacherGetAssignmentSummary(assignmentId: string, teacherId: string) {
    // assignment com populate para aluno e atividade
    const a = await this.assignmentModel
      .findById(assignmentId)
      .populate({ path: "studentId", select: "nome email role" })
      .populate({ path: "activityId" }) // precisa do questionario completo (gabarito)
      .lean();

    if (!a) throw new NotFoundException("Atribuição não encontrada.");
    if (a.teacherId.toString() !== teacherId) throw new ForbiddenException("Acesso negado.");

    const student = a.studentId as any;
    const activity = a.activityId as any;

    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    // submission pode não existir ainda
    const submission = await this.submissionModel
      .findOne({ assignmentId: new Types.ObjectId(assignmentId) })
      .lean();

    // correction por questão (se houver submission)
    let correction: Array<{
      index: number;
      assunto: string;
      enunciado: string;
      respostaAluno?: string;
      respostaCerta?: string;
      correta: boolean;
    }> = [];

    if (submission && Array.isArray(activity.questionario)) {
      correction = activity.questionario.map((q: any, idx: number) => {
        const respostaAluno = submission.answers?.[String(idx)];
        const respostaCerta = q?.respostaCerta;
        const correta =
          !!respostaAluno &&
          !!respostaCerta &&
          String(respostaAluno).toUpperCase() === String(respostaCerta).toUpperCase();

        return {
          index: idx,
          assunto: (q?.assunto ?? "").trim(),
          enunciado: q?.enunciado ?? "",
          respostaAluno,
          respostaCerta,
          correta,
        };
      });
    }

    // performance + topicsToImprove + wrongQuestions
    let performance: null | {
      totalQuestoes: number;
      acertos: number;
      erros: number;
      taxaAcerto: number;
      acertouTudo: boolean;
      mensagem: string;
    } = null;

    let topicsToImprove: null | Array<{
      assunto: string;
      total: number;
      erros: number;
      acertos: number;
      taxaAcerto: number;
    }> = null;

    let wrongQuestions: null | Array<{
      index: number;
      assunto: string;
      enunciado: string;
      respostaAluno?: string;
      respostaCerta?: string;
    }> = null;

    if (submission && Array.isArray(activity.questionario)) {
      const totalQuestoes = activity.questionario.length;
      const acertos = correction.filter((c) => c.correta).length;
      const erros = totalQuestoes - acertos;
      const taxaAcerto = totalQuestoes > 0 ? Math.round((acertos / totalQuestoes) * 100) : 0;
      const acertouTudo = erros === 0;

      performance = {
        totalQuestoes,
        acertos,
        erros,
        taxaAcerto,
        acertouTudo,
        mensagem: acertouTudo
          ? "Excelente desempenho: não necessita de reforço."
          : "Há pontos a reforçar: veja os tópicos e questões com erro abaixo.",
      };

      // agrupar por assunto
      const byTopic = new Map<string, { total: number; erros: number; acertos: number }>();

      for (const c of correction) {
        const assunto = (c.assunto || "Sem assunto").trim();
        const curr = byTopic.get(assunto) ?? { total: 0, erros: 0, acertos: 0 };
        curr.total += 1;
        if (c.correta) curr.acertos += 1;
        else curr.erros += 1;
        byTopic.set(assunto, curr);
      }

      topicsToImprove = Array.from(byTopic.entries())
        .map(([assunto, v]) => ({
          assunto,
          total: v.total,
          erros: v.erros,
          acertos: v.acertos,
          taxaAcerto: v.total ? Math.round((v.acertos / v.total) * 100) : 0,
        }))
        .sort((a, b) => b.erros - a.erros || a.taxaAcerto - b.taxaAcerto);

      wrongQuestions = correction
        .filter((c) => !c.correta)
        .map((c) => ({
          index: c.index,
          assunto: c.assunto || "Sem assunto",
          enunciado: c.enunciado,
          respostaAluno: c.respostaAluno,
          respostaCerta: c.respostaCerta,
        }));
    }

    return {
      assignment: {
        id: a._id.toString(),
        status: a.status,
        dueAt: a.dueAt ?? null,
       createdAt: (submission as any).createdAt ?? null,

        submissionId: a.submissionId?.toString?.() ?? null,
      },
      student: student
        ? {
            id: student._id.toString(),
            nome: student.nome,
            email: student.email,
            role: student.role,
          }
        : null,
      activity: {
        id: activity._id.toString(),
        descricao: activity.descricao,
        questionario: activity.questionario, // professor pode ver gabarito
        createdAt: activity.createdAt ?? null,
      },
      submission: submission
        ? {
            id: submission._id.toString(),
            answers: submission.answers,
            score: submission.score ?? null,
            total: submission.total ?? null,
            createdAt: (submission as any).createdAt ?? null,
          }
        : null,
      performance,
      topicsToImprove,
      wrongQuestions,
      correction: submission ? correction : null,
    };
  }
}
