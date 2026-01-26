import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export type AnswerOption = "A" | "B" | "C" | "D" | "E";

export class ReinforcementQuestionDto {
  @IsString()
  @MaxLength(2000)
  enunciado: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  assunto?: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @MaxLength(600, { each: true })
  alternativas: string[];

  @IsEnum(["A", "B", "C", "D", "E"])
  respostaCerta: AnswerOption;
}

export class CreateReinforcementActivityDto {
  @IsString()
  @MaxLength(180)
  descricao: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReinforcementQuestionDto)
  questionario: ReinforcementQuestionDto[];
}
