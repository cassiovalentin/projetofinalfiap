import { IsISO8601, IsMongoId, IsOptional } from "class-validator";

export class AssignReinforcementActivityDto {
  @IsMongoId()
  activityId: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}
