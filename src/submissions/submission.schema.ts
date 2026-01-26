import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type SubmissionDocument = Submission & Document;

export type AnswerOption = "A" | "B" | "C" | "D" | "E";

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, required: true, ref: "Assignment" })
  assignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "Activity" })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  teacherId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  answers: Record<string, AnswerOption>;

  @Prop({ type: Number })
  score?: number;

  @Prop({ type: Number })
  total?: number;

  // ✅ percentual (0..100)
  @Prop({ type: Number })
  percent?: number;

  // ✅ precisa de reforço?
  @Prop({ type: Boolean })
  needsReinforcement?: boolean;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ assignmentId: 1 }, { unique: true });
