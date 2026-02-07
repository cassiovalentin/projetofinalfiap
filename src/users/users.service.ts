import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { User, UserDocument } from "./user.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.userModel.exists({ email: dto.email });
    if (exists) throw new ConflictException("E-mail já cadastrado.");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.userModel.create({
      nome: dto.nome,
      email: dto.email,
      role: dto.role,
      passwordHash,
    });

    // retorno sem hash
    return {
      id: created._id,
      nome: created.nome,
      email: created.email,
      role: created.role,
      createdAt: (created as any).createdAt,
    };
  }

  async findAll() {
    const users = await this.userModel.find().sort({ _id: -1 }).lean();
    return users.map((u) => ({
      id: u._id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      createdAt: (u as any).createdAt,
    }));
  }

  async findOne(id: string) {
    const u = await this.userModel.findById(id).lean();
    if (!u) throw new NotFoundException("Usuário não encontrado.");
    return {
      id: u._id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      createdAt: (u as any).createdAt,
    };
  }

  async findByEmailWithPassword(email: string) {
    // select +passwordHash
    return this.userModel.findOne({ email }).select("+passwordHash").exec();
  }

  async findByEmail(email: string) {
  return this.userModel.findOne({ email }).lean().exec();
}

}
