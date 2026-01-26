import { IsISO8601, IsMongoId, IsOptional } from "class-validator";

export class AssignActivityToClassDto {
  @IsMongoId()
  activityId: string;

  @IsMongoId()
  classId: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}
