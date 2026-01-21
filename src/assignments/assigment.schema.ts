import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AssignmentDocument = Assignment & Document;

export type AssignmentStatus = "ASSIGNED" | "SUBMITTED" | "CLOSED";

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, required: true, ref: "Activity" })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  teacherId: Types.ObjectId;

  @Prop({ type: String, enum: ["ASSIGNED", "SUBMITTED", "CLOSED"], default: "ASSIGNED" })
  status: AssignmentStatus;

  @Prop({ type: Date, required: false })
  dueAt?: Date;

  @Prop({ type: Types.ObjectId, required: false, ref: "Submission" })
  submissionId?: Types.ObjectId;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

// Evita duplicar a mesma atribuição do mesmo professor para o mesmo aluno na mesma atividade
AssignmentSchema.index({ activityId: 1, studentId: 1, teacherId: 1 }, { unique: true });
