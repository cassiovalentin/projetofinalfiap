import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

/**
 * Reforço manual: professor escolhe questões do questionário ORIGINAL
 * via índices (0-based), e opcionalmente define descrição e prazo.
 */
export class ManualReinforcementDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  // opcional: limite para evitar abuso; ajuste conforme seu questionário
  @Max(999, { each: true })
  questionIndexes: number[];

  @IsOptional()
  @IsString()
  descriptionNote?: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}
