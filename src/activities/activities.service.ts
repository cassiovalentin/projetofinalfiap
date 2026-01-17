import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { Activity, ActivityDocument } from "./activity.schema";

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async create(dto: CreateActivityDto) {
    const created = await this.activityModel.create(dto);
    return {
      id: created._id,
      descricao: created.descricao,
      questionario: created.questionario,
      createdAt: (created as any).createdAt,
    };
  }

  async findAll() {
    const acts = await this.activityModel.find().sort({ _id: -1 }).lean();
    return acts.map((a) => ({
      id: a._id,
      descricao: a.descricao,
      questionario: a.questionario,
      createdAt: (a as any).createdAt,
    }));
  }

  async findOne(id: string) {
    const a = await this.activityModel.findById(id).lean();
    if (!a) throw new NotFoundException("Atividade não encontrada.");
    return {
      id: a._id,
      descricao: a.descricao,
      questionario: a.questionario,
      createdAt: (a as any).createdAt,
    };
  }
}
