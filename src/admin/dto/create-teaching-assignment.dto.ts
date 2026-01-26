import { IsMongoId } from "class-validator";

export class CreateTeachingAssignmentDto {
  @IsMongoId()
  teacherId: string;

  @IsMongoId()
  subjectId: string;

  @IsMongoId()
  classId: string;
}
