import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type SubmissionDocument = Submission & Document;

@Schema({ timestamps: true }) // ✅ ISSO resolve o problema
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
  answers: Record<string, "A" | "B" | "C" | "D" | "E">;

  @Prop({ type: Number })
  score?: number;

  @Prop({ type: Number })
  total?: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
