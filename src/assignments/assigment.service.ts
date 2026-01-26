import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Assignment, AssignmentDocument } from "./assigment.schema";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { AutoReinforcementDto } from "./dto/auto-reinforcement.dto";
import { CreateManualReinforcementDto } from "./dto/create-manual-reinforcement.dto";

import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user-role.enum";

import { Activity } from "../activities/activity.schema";
import { Submission } from "../submissions/submission.schema";
import { sanitizeActivityForStudent } from "../activities/activity.sanitizer";

import { CreateReinforcementActivityDto } from "src/activities/dto/create-reinforcement-activity.dto";
import { AssignReinforcementActivityDto } from "src/activities/dto/assign-reinforcement-activity.dto";

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,

    private readonly usersService: UsersService,

    @InjectModel(Activity.name)
    private readonly activityModel: Model<any>,

    @InjectModel(Submission.name)
    private readonly submissionModel: Model<any>,
  ) {}

  // =========================
  // Helpers
  // =========================
  private normalize(value: unknown): string {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // =========================
  // ALUNO: lista assignments do próprio aluno
  // =========================
  async listMyAssignments(studentId: string) {
    const assignments = await this.assignmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ _id: -1 })
      .lean();

    const activityIds = assignments.map((a: any) => a.activityId);
    const activities = await this.activityModel
      .find({ _id: { $in: activityIds } })
      .lean();

    const map = new Map<string, any>(
      activities.map((a: any) => [a._id.toString(), a]),
    );

    return assignments.map((a: any) => {
      const act = map.get(a.activityId.toString());
      return {
        assignmentId: a._id.toString(),
        status: a.status,
        isReinforcement: !!a.isReinforcement,
        originalAssignmentId: a.originalAssignmentId?.toString?.() ?? null,
        dueAt: a.dueAt ?? null,
        activity: act ? sanitizeActivityForStudent(act) : null,
      };
    });
  }

  // =========================
  // ALUNO: detalhe de 1 assignment do próprio aluno
  // =========================
  async getMyAssignmentById(assignmentId: string, studentId: string) {
    const a = await this.assignmentModel.findById(assignmentId).lean();
    if (!a) throw new NotFoundException("Atribuição não encontrada.");
    if (a.studentId.toString() !== studentId)
      throw new ForbiddenException("Acesso negado.");

    const activity = await this.activityModel.findById(a.activityId).lean();
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    return {
      assignmentId: a._id.toString(),
      status: a.status,
      isReinforcement: !!a.isReinforcement,
      originalAssignmentId: a.originalAssignmentId?.toString?.() ?? null,
      dueAt: a.dueAt ?? null,
      activity: sanitizeActivityForStudent(activity),
    };
  }

  // =========================
  // PROFESSOR: atribuir atividade para aluno
  // =========================
  async createAssignment(dto: CreateAssignmentDto, teacherId: string) {
    const student = await this.usersService.findOne(dto.studentId);
    if (!student) throw new NotFoundException("Aluno não encontrado.");
    if (student.role !== UserRole.ALUNO) {
      throw new ForbiddenException(
        "A atividade só pode ser atribuída para usuário ALUNO.",
      );
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
        isReinforcement: false,
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
      if (e?.code === 11000) throw new ConflictException("Atribuição duplicada.");
      throw e;
    }
  }

  // =========================
  // SUBMISSION: marcar assignment como enviado
  // =========================
  async markSubmitted(assignmentId: string, submissionId: string) {
    await this.assignmentModel.updateOne(
      { _id: new Types.ObjectId(assignmentId) },
      {
        $set: {
          status: "SUBMITTED",
          submissionId: new Types.ObjectId(submissionId),
        },
      },
    );
  }

  // =========================
  // Validar ownership do professor
  // =========================
  async getAssignmentForTeacherOrThrow(assignmentId: string, teacherId: string) {
    const a = await this.assignmentModel.findById(assignmentId).lean();
    if (!a) throw new NotFoundException("Atribuição não encontrada.");
    if (a.teacherId.toString() !== teacherId)
      throw new ForbiddenException("Acesso negado.");
    return a;
  }

  // =========================
  // PROFESSOR: listar atribuições
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
      isReinforcement: !!a.isReinforcement,
      originalAssignmentId: a.originalAssignmentId?.toString?.() ?? null,
      dueAt: a.dueAt ?? null,
      createdAt: a.createdAt ?? null,
      submissionId: a.submissionId?.toString?.() ?? null,

      student: a.studentId
        ? { id: a.studentId._id.toString(), nome: a.studentId.nome, email: a.studentId.email }
        : { id: a.studentId?.toString?.() ?? "", nome: "—", email: "—" },

      activity: a.activityId
        ? { id: a.activityId._id.toString(), descricao: a.activityId.descricao }
        : { id: a.activityId?.toString?.() ?? "", descricao: "—" },
    }));
  }

  // =========================
  // PROFESSOR: summary consolidado
  // =========================
  async teacherGetAssignmentSummary(assignmentId: string, teacherId: string) {
    const a = await this.assignmentModel
      .findById(assignmentId)
      .populate({ path: "studentId", select: "nome email role" })
      .populate({ path: "activityId" })
      .lean();

    if (!a) throw new NotFoundException("Atribuição não encontrada.");
    if (a.teacherId.toString() !== teacherId)
      throw new ForbiddenException("Acesso negado.");

    const student = a.studentId as any;
    const activity = a.activityId as any;
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    const submission = await this.submissionModel
      .findOne({ assignmentId: new Types.ObjectId(assignmentId) })
      .lean();

    let correction: Array<{
      index: number;
      assunto: string;
      enunciado: string;
      respostaAluno?: string;
      respostaCerta?: string;
      correta: boolean;
    }> = [];

    if (submission && Array.isArray(activity.questionario)) {
      const answers: Record<string, string> = submission.answers ?? {};
      correction = activity.questionario.map((q: any, idx: number) => {
        const respostaAluno = answers[String(idx)];
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

    let performance: any = null;
    let topicsToImprove: any = null;
    let wrongQuestions: any = null;

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
        .sort((x, y) => y.erros - x.erros || x.taxaAcerto - y.taxaAcerto);

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
        isReinforcement: !!a.isReinforcement,
        originalAssignmentId: a.originalAssignmentId?.toString?.() ?? null,
        dueAt: a.dueAt ?? null,
        createdAt: (a as any).createdAt ?? null,
        submissionId: a.submissionId?.toString?.() ?? null,
      },
      student: student
        ? { id: student._id.toString(), nome: student.nome, email: student.email, role: student.role }
        : null,
      activity: {
        id: activity._id.toString(),
        descricao: activity.descricao,
        questionario: activity.questionario,
        minPercentToNoReinforcement: activity.minPercentToNoReinforcement ?? 70,
      },
      submission: submission
        ? {
            id: submission._id.toString(),
            answers: submission.answers,
            score: submission.score ?? null,
            total: submission.total ?? null,
            percent: submission.percent ?? null,
            needsReinforcement: submission.needsReinforcement ?? null,
            createdAt: (submission as any).createdAt ?? null,
          }
        : null,
      performance,
      topicsToImprove,
      wrongQuestions,
      correction: submission ? correction : null,
    };
  }

  // =========================
  // ✅ PROFESSOR: listar quem precisa reforço
  // =========================
  async teacherListNeedsReinforcement(teacherId: string) {
    const subs = await this.submissionModel
      .find({
        teacherId: new Types.ObjectId(teacherId),
        needsReinforcement: true,
      })
      .sort({ _id: -1 })
      .populate({ path: "studentId", select: "nome email" })
      .populate({ path: "activityId", select: "descricao minPercentToNoReinforcement" })
      .lean();

    return subs.map((s: any) => ({
      assignmentId: s.assignmentId?.toString?.() ?? "",
      student: s.studentId
        ? { id: s.studentId._id.toString(), nome: s.studentId.nome, email: s.studentId.email }
        : { id: s.studentId?.toString?.() ?? "", nome: "—", email: "—" },
      activity: s.activityId
        ? { id: s.activityId._id.toString(), descricao: s.activityId.descricao }
        : { id: s.activityId?.toString?.() ?? "", descricao: "—" },
      percent: s.percent ?? null,
      threshold: s.activityId?.minPercentToNoReinforcement ?? 70,
      createdAt: s.createdAt ?? null,
    }));
  }

  // =========================
  // ✅ REFORÇO AUTOMÁTICO
  // =========================
  async teacherCreateReinforcementAuto(
    originalAssignmentId: string,
    teacherId: string,
    dto: AutoReinforcementDto,
  ) {
    const original = await this.assignmentModel.findById(originalAssignmentId).lean();
    if (!original) throw new NotFoundException("Atribuição original não encontrada.");
    if (original.teacherId.toString() !== teacherId) throw new ForbiddenException("Acesso negado.");
    if (original.isReinforcement) throw new BadRequestException("Não é possível reforçar um reforço.");

    const submission = await this.submissionModel
      .findOne({ assignmentId: new Types.ObjectId(originalAssignmentId) })
      .lean();

    if (!submission) {
      throw new BadRequestException("O aluno ainda não enviou a atividade. Não há base para reforço.");
    }

    const activity = await this.activityModel.findById(original.activityId).lean();
    if (!activity || !Array.isArray(activity.questionario)) {
      throw new BadRequestException("Atividade inválida ou sem questionário.");
    }

    const answers: Record<string, string> = submission.answers ?? {};

    const wrong = activity.questionario
      .map((q: any, idx: number) => {
        const aluno = this.normalize(answers[String(idx)]);
        const certa = this.normalize(q?.respostaCerta);
        const correta = aluno && certa && aluno === certa;

        return {
          correta,
          assuntoNorm: this.normalize(q?.assunto ?? "Sem assunto"),
          q,
        };
      })
      .filter((x: any) => !x.correta);

    if (wrong.length === 0) {
      return { created: false, message: "Aluno acertou tudo. Reforço não é necessário." };
    }

    const topicsFromErrors = Array.from(new Set(wrong.map((w: any) => w.assuntoNorm)));

    const desiredTopicsNorm =
      dto.topics && dto.topics.length > 0
        ? dto.topics.map((t) => this.normalize(t)).filter(Boolean)
        : topicsFromErrors;

    const candidates = wrong.filter((w: any) => desiredTopicsNorm.includes(w.assuntoNorm));
    if (candidates.length === 0) {
      throw new BadRequestException("Nenhuma questão encontrada para os tópicos selecionados.");
    }

    const limit = dto.questionCount ?? Math.min(10, candidates.length);
    const selected = candidates.slice(0, Math.min(limit, candidates.length)).map((x: any) => x.q);

    const reinforcementActivity = await this.activityModel.create({
      descricao: `Reforço: ${activity.descricao}`.slice(0, 180),
      questionario: selected,
      minPercentToNoReinforcement: activity.minPercentToNoReinforcement ?? 70,
      isReinforcement: true,
      originalActivityId: new Types.ObjectId(activity._id),
      createdByTeacherId: new Types.ObjectId(teacherId), // required
    });

    const reinforcementAssignment = await this.assignmentModel.create({
      activityId: new Types.ObjectId(reinforcementActivity._id),
      studentId: new Types.ObjectId(original.studentId),
      teacherId: new Types.ObjectId(teacherId),
      status: "ASSIGNED",
      isReinforcement: true,
      originalAssignmentId: new Types.ObjectId(originalAssignmentId),
    });

    await this.assignmentModel.updateOne(
      { _id: new Types.ObjectId(originalAssignmentId) },
      { $set: { status: "REINFORCEMENT_ASSIGNED" } },
    );

    return {
      created: true,
      originalAssignmentId,
      studentId: original.studentId.toString(),
      reinforcement: {
        assignmentId: reinforcementAssignment._id.toString(),
        activityId: reinforcementActivity._id.toString(),
        descricao: reinforcementActivity.descricao,
        questionCount: selected.length,
        topics: desiredTopicsNorm,
        status: reinforcementAssignment.status,
      },
    };
  }

  // =========================
  // ✅ REFORÇO MANUAL (modo “criar atividade”)
  // =========================
  async teacherCreateReinforcementManual(
    originalAssignmentId: string,
    teacherId: string,
    dto: CreateManualReinforcementDto,
  ) {
    const original = await this.assignmentModel.findById(originalAssignmentId).lean();
    if (!original) throw new NotFoundException("Atribuição original não encontrada.");
    if (original.teacherId.toString() !== teacherId) throw new ForbiddenException("Acesso negado.");
    if (original.isReinforcement) throw new BadRequestException("Não é possível criar reforço manual a partir de um reforço.");

    // valida atividade original (para manter vínculo originalActivityId e herdar threshold)
    const originalActivity = await this.activityModel.findById(original.activityId).lean();
    if (!originalActivity) throw new NotFoundException("Atividade original não encontrada.");

    // (opcional) se quiser exigir submissão para permitir reforço manual:
    // const submission = await this.submissionModel
    //   .findOne({ assignmentId: new Types.ObjectId(originalAssignmentId) })
    //   .lean();
    // if (!submission) throw new BadRequestException("Aluno ainda não enviou esta atividade.");

    const reinforcementActivity = await this.activityModel.create({
      descricao: dto.descricao.slice(0, 180),
      questionario: dto.questionario,
      minPercentToNoReinforcement: originalActivity.minPercentToNoReinforcement ?? 70,
      isReinforcement: true,
      originalActivityId: new Types.ObjectId(originalActivity._id),
      createdByTeacherId: new Types.ObjectId(teacherId), // ✅ required
    });

    const reinforcementAssignment = await this.assignmentModel.create({
      activityId: new Types.ObjectId(reinforcementActivity._id),
      studentId: new Types.ObjectId(original.studentId),
      teacherId: new Types.ObjectId(teacherId),
      status: "ASSIGNED",
      isReinforcement: true,
      originalAssignmentId: new Types.ObjectId(originalAssignmentId),
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });

    await this.assignmentModel.updateOne(
      { _id: new Types.ObjectId(originalAssignmentId) },
      { $set: { status: "REINFORCEMENT_ASSIGNED" } },
    );

    return {
      created: true,
      originalAssignmentId,
      studentId: original.studentId.toString(),
      reinforcement: {
        assignmentId: reinforcementAssignment._id.toString(),
        activityId: reinforcementActivity._id.toString(),
        descricao: reinforcementActivity.descricao,
        questionCount: Array.isArray(dto.questionario) ? dto.questionario.length : 0,
        status: reinforcementAssignment.status,
        dueAt: reinforcementAssignment.dueAt ?? null,
      },
    };
  }

  // =========================
  // ✅ PROFESSOR: listar reforços vinculados
  // =========================
  async teacherListReinforcements(assignmentId: string, teacherId: string) {
    await this.getAssignmentForTeacherOrThrow(assignmentId, teacherId);

    const list = await this.assignmentModel
      .find({
        teacherId: new Types.ObjectId(teacherId),
        isReinforcement: true,
        originalAssignmentId: new Types.ObjectId(assignmentId),
      })
      .sort({ _id: -1 })
      .populate({ path: "activityId", select: "descricao" })
      .lean();

    return list.map((a: any) => ({
      id: a._id.toString(),
      status: a.status,
      createdAt: a.createdAt ?? null,
      dueAt: a.dueAt ?? null,
      activity: a.activityId
        ? { id: a.activityId._id.toString(), descricao: a.activityId.descricao }
        : { id: a.activityId?.toString?.() ?? "", descricao: "—" },
    }));
  }


   // ======================================================
  // 1) Criar/SALVAR Activity de reforço (manual) no banco
  // ======================================================
  async teacherCreateManualReinforcementActivity(
    originalAssignmentId: string,
    teacherId: string,
    dto: CreateReinforcementActivityDto,
  ) {
    // assignment original
    const original = await this.assignmentModel.findById(originalAssignmentId).lean();
    if (!original) throw new NotFoundException("Atribuição original não encontrada.");
    if (original.teacherId.toString() !== teacherId)
      throw new ForbiddenException("Acesso negado.");
    if (original.isReinforcement)
      throw new BadRequestException("Não é possível criar reforço a partir de um reforço.");

    // atividade original (para vincular originalActivityId e herdar threshold)
    const originalActivity = await this.activityModel.findById(original.activityId).lean();
    if (!originalActivity) throw new NotFoundException("Atividade original não encontrada.");

    const descricao = String(dto.descricao ?? "").trim();
    if (!descricao) throw new BadRequestException("Descrição é obrigatória.");

    if (!Array.isArray(dto.questionario) || dto.questionario.length === 0) {
      throw new BadRequestException("Questionário é obrigatório.");
    }

    // cria activity de reforço (SALVA no banco)
    const created = await this.activityModel.create({
      descricao: descricao.slice(0, 180),
      questionario: dto.questionario,
      minPercentToNoReinforcement: originalActivity.minPercentToNoReinforcement ?? 70,
      isReinforcement: true,
      originalActivityId: new Types.ObjectId(originalActivity._id),

      // 🔥 obrigatório no seu schema
      createdByTeacherId: new Types.ObjectId(teacherId),
    });

    return {
      activityId: created._id.toString(),
      descricao: created.descricao,
      questionCount: Array.isArray(created.questionario) ? created.questionario.length : 0,
      originalActivityId: originalActivity._id.toString(),
      createdAt: (created as any).createdAt ?? null,
    };
  }

  // ======================================================
  // 2) DISPONIBILIZAR reforço: cria Assignment usando activityId já salvo
  // ======================================================
  async teacherAssignManualReinforcementActivity(
    originalAssignmentId: string,
    teacherId: string,
    dto: AssignReinforcementActivityDto,
  ) {
    // assignment original
    const original = await this.assignmentModel.findById(originalAssignmentId).lean();
    if (!original) throw new NotFoundException("Atribuição original não encontrada.");
    if (original.teacherId.toString() !== teacherId)
      throw new ForbiddenException("Acesso negado.");
    if (original.isReinforcement)
      throw new BadRequestException("Não é possível criar reforço a partir de um reforço.");

    // activity escolhida
    const reinforcementActivity = await this.activityModel
      .findById(dto.activityId)
      .lean();

    if (!reinforcementActivity)
      throw new NotFoundException("Atividade de reforço não encontrada.");

    // valida ownership da activity (criada pelo professor)
    // (se seu schema usa outro campo para autoria, ajuste aqui)
    if (String(reinforcementActivity.createdByTeacherId) !== String(teacherId)) {
      throw new ForbiddenException("Você não é o criador desta atividade de reforço.");
    }

    // valida se é reforço
    if (!reinforcementActivity.isReinforcement) {
      throw new BadRequestException("A atividade informada não está marcada como reforço.");
    }

    // valida se pertence ao mesmo originalActivityId (evita usar reforço de outra base)
    if (
      reinforcementActivity.originalActivityId?.toString?.() &&
      String(reinforcementActivity.originalActivityId) !== String(original.activityId)
    ) {
      throw new BadRequestException(
        "A atividade de reforço não corresponde à atividade original deste assignment.",
      );
    }

    // cria assignment de reforço
    const reinforcementAssignment = await this.assignmentModel.create({
      activityId: new Types.ObjectId(reinforcementActivity._id),
      studentId: new Types.ObjectId(original.studentId),
      teacherId: new Types.ObjectId(teacherId),
      status: "ASSIGNED",
      isReinforcement: true,
      originalAssignmentId: new Types.ObjectId(originalAssignmentId),
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });

    // marca original como “tem reforço”
    await this.assignmentModel.updateOne(
      { _id: new Types.ObjectId(originalAssignmentId) },
      { $set: { status: "REINFORCEMENT_ASSIGNED" } },
    );

    return {
      created: true,
      originalAssignmentId,
      reinforcement: {
        assignmentId: reinforcementAssignment._id.toString(),
        activityId: reinforcementActivity._id.toString(),
        descricao: reinforcementActivity.descricao,
        questionCount: Array.isArray(reinforcementActivity.questionario)
          ? reinforcementActivity.questionario.length
          : 0,
        dueAt: reinforcementAssignment.dueAt ?? null,
        status: reinforcementAssignment.status,
      },
    };
  }
}
