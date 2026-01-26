import { IsArray, IsInt, IsOptional, IsString, Min } from "class-validator";

export class AutoReinforcementDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  questionCount?: number;
}
