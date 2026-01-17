import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ActivityDocument = Activity & Document;

class Alternativas {
  @Prop({ required: true }) A: string;
  @Prop({ required: true }) B: string;
  @Prop({ required: true }) C: string;
  @Prop({ required: true }) D: string;
  @Prop({ required: true }) E: string;
}

class Pergunta {
  @Prop({ required: true })
  enunciado: string;

  @Prop({ required: true })
  assunto: string;

  @Prop({ required: true, type: Alternativas })
  alternativas: Alternativas;

  @Prop({ required: true, enum: ["A", "B", "C", "D", "E"] })
  respostaCerta: "A" | "B" | "C" | "D" | "E";
}

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true })
  descricao: string;

  @Prop({ required: true, type: [Pergunta] })
  questionario: Pergunta[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
