import { IsIn, IsNotEmptyObject, IsObject } from "class-validator";

export class SubmitAssignmentDto {
  @IsObject()
  @IsNotEmptyObject()
  answers: Record<string, "A" | "B" | "C" | "D" | "E">;
}
