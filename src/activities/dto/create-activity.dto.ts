import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class AlternativasDto {
  @IsString() @IsNotEmpty() A: string;
  @IsString() @IsNotEmpty() B: string;
  @IsString() @IsNotEmpty() C: string;
  @IsString() @IsNotEmpty() D: string;
  @IsString() @IsNotEmpty() E: string;
}

class PerguntaDto {
  @IsString()
  @IsNotEmpty()
  enunciado: string;

  @IsString()
  @IsNotEmpty()
  assunto: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AlternativasDto)
  alternativas: AlternativasDto;

  @IsIn(["A", "B", "C", "D", "E"])
  respostaCerta: "A" | "B" | "C" | "D" | "E";
}

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PerguntaDto)
  questionario: PerguntaDto[];
}
