import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AssignmentDocument = Assignment & Document;

export type AssignmentStatus =
  | "ASSIGNED"
  | "SUBMITTED"
  | "NEEDS_REINFORCEMENT"
  | "REINFORCEMENT_ASSIGNED"
  | "CLOSED";

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, required: true, ref: "Activity" })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  teacherId: Types.ObjectId;

  @Prop({ type: String, default: "ASSIGNED" })
  status: AssignmentStatus;

  @Prop({ type: Date, required: false })
  dueAt?: Date;

  @Prop({ type: Types.ObjectId, required: false, ref: "Submission" })
  submissionId?: Types.ObjectId;

  // ✅ reforço
  @Prop({ type: Boolean, default: false })
  isReinforcement: boolean;

  // ✅ aponta para o assignment original (pai)
  @Prop({ type: Types.ObjectId, required: false, ref: "Assignment" })
  originalAssignmentId?: Types.ObjectId;

  // ✅ contexto do reforço (opcional, mas útil para UI)
  @Prop({
    type: {
      percent: { type: Number },
      threshold: { type: Number },
      topicsToImprove: { type: [String] },
    },
    required: false,
  })
  reinforcementReason?: {
    percent?: number;
    threshold?: number;
    topicsToImprove?: string[];
  };
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

// Índice opcional contra duplicidade do professor atribuir mesma atividade ao mesmo aluno
AssignmentSchema.index({ teacherId: 1, activityId: 1, studentId: 1, isReinforcement: 1 }, { unique: false });
