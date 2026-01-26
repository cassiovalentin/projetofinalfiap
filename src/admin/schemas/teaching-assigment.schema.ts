import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type TeachingAssignmentDocument = TeachingAssignment & Document;

@Schema({ timestamps: true })
export class TeachingAssignment {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "Subject" })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "Class" })
  classId: Types.ObjectId;

  @Prop({ type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  status: "ACTIVE" | "INACTIVE";
}

export const TeachingAssignmentSchema = SchemaFactory.createForClass(TeachingAssignment);
TeachingAssignmentSchema.index({ teacherId: 1, subjectId: 1, classId: 1 }, { unique: true });
