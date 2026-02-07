import { Module } from "@nestjs/common";
import { JwtModule, JwtSignOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

function getExpiresIn(): JwtSignOptions["expiresIn"] {
  const v = process.env.JWT_EXPIRES_IN;

  if (!v) return "8h";                 // default
  if (/^\d+$/.test(v)) return Number(v); // ex: "3600" -> 3600 (segundos)

  return v as JwtSignOptions["expiresIn"]; // ex: "8h", "1d", "30m"
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
  JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret_change_me",
      signOptions: { expiresIn: getExpiresIn() },
    }),


  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
