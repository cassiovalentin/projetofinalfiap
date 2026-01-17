import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { UserRole } from "../user-role.enum";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}
