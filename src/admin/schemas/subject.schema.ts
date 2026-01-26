import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true, maxlength: 120 })
  nome: string;

  @Prop({ required: false, maxlength: 30 })
  codigo?: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
SubjectSchema.index({ nome: 1 }, { unique: true });
