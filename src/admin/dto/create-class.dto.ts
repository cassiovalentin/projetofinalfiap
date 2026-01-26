import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateClassDto {
  @IsString()
  nome: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  anoLetivo: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
