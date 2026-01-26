import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSubjectDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  codigo?: string;
}
