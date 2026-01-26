import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Class, ClassDocument } from "../../admin/schemas/class.schema";
import {
  TeachingAssignment
  
} from "src/admin/schemas/teaching-assigment.schema";
import { TeachingAssignmentDocument } from "src/admin/schemas/teaching-assigment.schema";

type TeacherClassListItem = {
  id: string;
  nome: string;
};

@Injectable()
export class TeacherClassesService {
  constructor(
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,

    @InjectModel(TeachingAssignment.name)
    private readonly teachingAssignmentModel: Model<TeachingAssignmentDocument>,
  ) {}

  /**
   * Lista SOMENTE as turmas em que o professor possui vínculo ATIVO.
   */
  async listMyClasses(teacherId: string): Promise<TeacherClassListItem[]> {
    const teacherObjectId = new Types.ObjectId(teacherId);

    // 1️⃣ Buscar vínculos ativos do professor
    const links = await this.teachingAssignmentModel
      .find({
        teacherId: teacherObjectId,
        status: "ACTIVE",
      })
      .select({ classId: 1 })
      .lean();

    if (links.length === 0) return [];

    // 2️⃣ Extrair classIds únicos
    const classIds = Array.from(
      new Set(links.map((l) => l.classId.toString())),
    ).map((id) => new Types.ObjectId(id));

    // 3️⃣ Buscar turmas
    const classes = await this.classModel
      .find({ _id: { $in: classIds } })
      .select({ _id: 1, nome: 1 })
      .sort({ nome: 1 })
      .lean();

    return classes.map((c) => ({
      id: c._id.toString(),
      nome: c.nome,
    }));
  }
}
