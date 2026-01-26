import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as bcrypt from "bcrypt";

import { User } from "../users/user.schema";
import { UserRole } from "../users/user-role.enum";

import { Class, ClassDocument } from "./schemas/class.schema";
import { Subject, SubjectDocument } from "./schemas/subject.schema";
import { Enrollment, EnrollmentDocument } from "./schemas/enrollment.schema";
import { TeachingAssignment, TeachingAssignmentDocument } from "./schemas/teaching-assigment.schema";

import { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import { AdminResetPasswordDto } from "./dto/admin-reset-password.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { CreateTeachingAssignmentDto } from "./dto/create-teaching-assignment.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<any>,
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
    @InjectModel(Subject.name) private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(TeachingAssignment.name) private readonly teachingModel: Model<TeachingAssignmentDocument>,
  ) {}

  // ===== Users =====
  async createUser(dto: AdminCreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    // SECRETARIA pode criar SECRETARIA, PROFESSOR, ALUNO
    const exists = await this.userModel.findOne({ email }).lean();
    if (exists) throw new ConflictException("E-mail já cadastrado.");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.userModel.create({
      nome: dto.nome,
      email,
      role: dto.role,
      passwordHash,
    });

    return {
      id: created._id.toString(),
      nome: created.nome,
      email: created.email,
      role: created.role,
    };
  }

  async listUsers(role?: UserRole) {
    const where: any = {};
    if (role) where.role = role;
    const users = await this.userModel.find(where).sort({ nome: 1 }).lean();
    return users.map((u: any) => ({
      id: u._id.toString(),
      nome: u.nome,
      email: u.email,
      role: u.role,
    }));
  }

  async resetPassword(userId: string, dto: AdminResetPasswordDto) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.userModel.updateOne({ _id: new Types.ObjectId(userId) }, { $set: { passwordHash } });

    return { ok: true };
  }

  // ===== Classes =====
  async createClass(dto: CreateClassDto) {
    try {
      const created = await this.classModel.create({
        nome: dto.nome,
        anoLetivo: dto.anoLetivo,
        ativo: dto.ativo ?? true,
      });
      return { id: created._id.toString(), nome: created.nome, anoLetivo: created.anoLetivo, ativo: created.ativo };
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException("Turma já existe (nome + anoLetivo).");
      throw e;
    }
  }

  async listClasses() {
    const list = await this.classModel.find({}).sort({ anoLetivo: -1, nome: 1 }).lean();
    return list.map((c) => ({ id: c._id.toString(), nome: c.nome, anoLetivo: c.anoLetivo, ativo: c.ativo }));
  }

  // ===== Subjects =====
  async createSubject(dto: CreateSubjectDto) {
    try {
      const created = await this.subjectModel.create({ nome: dto.nome, codigo: dto.codigo });
      return { id: created._id.toString(), nome: created.nome, codigo: created.codigo ?? null };
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException("Disciplina já existe.");
      throw e;
    }
  }

  async listSubjects() {
    const list = await this.subjectModel.find({}).sort({ nome: 1 }).lean();
    return list.map((s) => ({ id: s._id.toString(), nome: s.nome, codigo: s.codigo ?? null }));
  }

  // ===== Enrollment (matrícula) =====
  async enrollStudent(dto: CreateEnrollmentDto) {
    const student = await this.userModel.findById(dto.studentId).lean();
    if (!student) throw new NotFoundException("Aluno não encontrado.");
    if (student.role !== UserRole.ALUNO) throw new ForbiddenException("Somente ALUNO pode ser matriculado.");

    const turma = await this.classModel.findById(dto.classId).lean();
    if (!turma) throw new NotFoundException("Turma não encontrada.");

    try {
      const created = await this.enrollmentModel.create({
        studentId: new Types.ObjectId(dto.studentId),
        classId: new Types.ObjectId(dto.classId),
        status: "ACTIVE",
      });
      return { id: created._id.toString(), studentId: dto.studentId, classId: dto.classId, status: created.status };
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException("Aluno já está matriculado nessa turma.");
      throw e;
    }
  }

  async listClassStudents(classId: string) {
    const turma = await this.classModel.findById(classId).lean();
    if (!turma) throw new NotFoundException("Turma não encontrada.");

    const enrolls = await this.enrollmentModel
      .find({ classId: new Types.ObjectId(classId), status: "ACTIVE" })
      .populate({ path: "studentId", select: "nome email role" })
      .lean();

    return enrolls.map((e: any) => ({
      enrollmentId: e._id.toString(),
      student: {
        id: e.studentId._id.toString(),
        nome: e.studentId.nome,
        email: e.studentId.email,
      },
    }));
  }

  // ===== TeachingAssignment (professor ⇄ disciplina ⇄ turma) =====
  async assignTeacher(dto: CreateTeachingAssignmentDto) {
    const teacher = await this.userModel.findById(dto.teacherId).lean();
    if (!teacher) throw new NotFoundException("Professor não encontrado.");
    if (teacher.role !== UserRole.PROFESSOR) throw new ForbiddenException("Somente PROFESSOR pode ser associado.");

    const turma = await this.classModel.findById(dto.classId).lean();
    if (!turma) throw new NotFoundException("Turma não encontrada.");

    const subject = await this.subjectModel.findById(dto.subjectId).lean();
    if (!subject) throw new NotFoundException("Disciplina não encontrada.");

    try {
      const created = await this.teachingModel.create({
        teacherId: new Types.ObjectId(dto.teacherId),
        classId: new Types.ObjectId(dto.classId),
        subjectId: new Types.ObjectId(dto.subjectId),
        status: "ACTIVE",
      });

      return {
        id: created._id.toString(),
        teacherId: dto.teacherId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        status: created.status,
      };
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException("Associação já existe.");
      throw e;
    }
  }

  async listTeacherAssignments(teacherId: string) {
    const list = await this.teachingModel
      .find({ teacherId: new Types.ObjectId(teacherId), status: "ACTIVE" })
      .populate({ path: "classId", select: "nome anoLetivo" })
      .populate({ path: "subjectId", select: "nome codigo" })
      .lean();

    return list.map((t: any) => ({
      id: t._id.toString(),
      class: { id: t.classId._id.toString(), nome: t.classId.nome, anoLetivo: t.classId.anoLetivo },
      subject: { id: t.subjectId._id.toString(), nome: t.subjectId.nome, codigo: t.subjectId.codigo ?? null },
      status: t.status,
    }));
  }
}
