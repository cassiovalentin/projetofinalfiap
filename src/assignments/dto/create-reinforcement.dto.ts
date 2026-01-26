import { IsMongoId } from "class-validator";

export class CreateReinforcementDto {
  @IsMongoId()
  activityId: string;
}
