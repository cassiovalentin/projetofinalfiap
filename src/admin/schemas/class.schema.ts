import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ClassDocument = Class & Document;

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, maxlength: 120 })
  nome: string;

  @Prop({ required: true })
  anoLetivo: number;

  @Prop({ default: true })
  ativo: boolean;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
ClassSchema.index({ nome: 1, anoLetivo: 1 }, { unique: true });
