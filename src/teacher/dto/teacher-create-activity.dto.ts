import { IsInt, IsMongoId, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class TeacherCreateActivityQuestionDto {
  @IsString()
  enunciado: string;

  @IsString()
  assunto: string;

  alternativas: { A: string; B: string; C: string; D: string; E: string };

  @IsString()
  respostaCerta: "A" | "B" | "C" | "D" | "E";
}

export class TeacherCreateActivityDto {
  @IsString()
  descricao: string;

  @IsOptional()
  @IsMongoId()
  subjectId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minPercentToNoReinforcement?: number;

  @ValidateNested({ each: true })
  @Type(() => TeacherCreateActivityQuestionDto)
  questionario: TeacherCreateActivityQuestionDto[];
}
