import { IsMongoId } from "class-validator";

export class CreateEnrollmentDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  classId: string;
}
