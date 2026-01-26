import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { UserRole } from "../../users/user-role.enum";

export class AdminCreateUserDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(6)
  password: string;
}
