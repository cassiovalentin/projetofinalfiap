import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type EnrollmentDocument = Enrollment & Document;

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "Class" })
  classId: Types.ObjectId;

  @Prop({ type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  status: "ACTIVE" | "INACTIVE";
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });
