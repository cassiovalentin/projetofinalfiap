import { IsISO8601, IsMongoId, IsOptional } from "class-validator";

export class CreateAssignmentDto {
  @IsMongoId()
  activityId: string;

  @IsMongoId()
  studentId: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}
