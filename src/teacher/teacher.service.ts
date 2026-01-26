import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Activity } from "../activities/activity.schema";
import { Enrollment } from "../admin/schemas/enrollment.schema";
import { TeachingAssignment } from "../admin/schemas/teaching-assigment.schema";
import { AssignmentsService } from "../assignments/assigment.service";  

import { TeacherCreateActivityDto } from "./dto/teacher-create-activity.dto";
import { AssignActivityToClassDto } from "./dto/assign-activity-to-class.dto";

@Injectable()
export class TeacherService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<any>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<any>,
    @InjectModel(TeachingAssignment.name) private readonly teachingModel: Model<any>,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  async listMyActivities(teacherId: string) {
    const list = await this.activityModel
      .find({ createdByTeacherId: new Types.ObjectId(teacherId) })
      .sort({ _id: -1 })
      .select({ descricao: 1, subjectId: 1, minPercentToNoReinforcement: 1, createdAt: 1 })
      .lean();

    return list.map((a: any) => ({
      id: a._id.toString(),
      descricao: a.descricao,
      subjectId: a.subjectId?.toString?.() ?? null,
      minPercentToNoReinforcement: a.minPercentToNoReinforcement ?? 70,
      createdAt: a.createdAt ?? null,
    }));
  }

  async createActivity(dto: TeacherCreateActivityDto, teacherId: string) {
    const created = await this.activityModel.create({
      descricao: dto.descricao,
      subjectId: dto.subjectId ? new Types.ObjectId(dto.subjectId) : undefined,
      createdByTeacherId: new Types.ObjectId(teacherId),
      minPercentToNoReinforcement: dto.minPercentToNoReinforcement ?? 70,
      questionario: dto.questionario,
    });

    return {
      id: created._id.toString(),
      descricao: created.descricao,
      subjectId: created.subjectId?.toString?.() ?? null,
      minPercentToNoReinforcement: created.minPercentToNoReinforcement,
      createdAt: (created as any).createdAt ?? null,
    };
  }

  async assignActivityToClass(dto: AssignActivityToClassDto, teacherId: string) {
    const activity = await this.activityModel.findById(dto.activityId).lean();
    if (!activity) throw new NotFoundException("Atividade não encontrada.");

    if (activity.subjectId) {
      const ta = await this.teachingModel
        .findOne({
          teacherId: new Types.ObjectId(teacherId),
          classId: new Types.ObjectId(dto.classId),
          subjectId: new Types.ObjectId(activity.subjectId),
          status: "ACTIVE",
        })
        .lean();

      if (!ta) throw new ForbiddenException("Você não está associado a essa turma/disciplina.");
    }

    const enrolls = await this.enrollmentModel
      .find({ classId: new Types.ObjectId(dto.classId), status: "ACTIVE" })
      .lean();

    if (enrolls.length === 0) {
      return { created: 0, totalStudents: 0, message: "Nenhum aluno matriculado nessa turma." };
    }

    const results = await Promise.allSettled(
      enrolls.map((e: any) =>
        this.assignmentsService.createAssignment(
          { activityId: dto.activityId, studentId: e.studentId.toString(), dueAt: dto.dueAt },
          teacherId,
        ),
      ),
    );

    const createdCount = results.filter((r) => r.status === "fulfilled").length;

    return {
      created: createdCount,
      totalStudents: enrolls.length,
      message: `Atribuída para ${createdCount}/${enrolls.length} alunos.`,
    };
  }
}
