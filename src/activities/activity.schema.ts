import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ActivityDocument = Activity & Document;

export type AnswerOption = "A" | "B" | "C" | "D" | "E";

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true })
  descricao: string;

  @Prop({ type: Types.ObjectId, required: false, ref: "Subject" })
  subjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  createdByTeacherId: Types.ObjectId;

  // ✅ percentual mínimo para não precisar de reforço (ex.: 70)
  @Prop({ type: Number, default: 70, min: 0, max: 100 })
  minPercentToNoReinforcement: number;

  @Prop({
    type: [
      {
        enunciado: { type: String, required: true },
        assunto: { type: String, required: true },
        alternativas: {
          A: { type: String, required: true },
          B: { type: String, required: true },
          C: { type: String, required: true },
          D: { type: String, required: true },
          E: { type: String, required: true },
        },
        respostaCerta: { type: String, enum: ["A", "B", "C", "D", "E"], required: true },
      },
    ],
    required: true,
  })
  questionario: Array<{
    enunciado: string;
    assunto: string;
    alternativas: { A: string; B: string; C: string; D: string; E: string };
    respostaCerta: AnswerOption;
  }>;

  @Prop({ default: false })
isReinforcement?: boolean;

@Prop({ type: Types.ObjectId, required: false })
originActivityId?: Types.ObjectId;

@Prop({ type: Types.ObjectId, required: false })
createdBy?: Types.ObjectId;

}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
