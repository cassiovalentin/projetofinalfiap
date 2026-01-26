import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { UserRole } from "../../users/user-role.enum";
import { CurrentUser } from "src/auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "src/auth/dto/current-user.decorator";
import { TeacherClassesService } from "./teacher-classes.service";

@Controller("teacher/classes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROFESSOR)
export class TeacherClassesController {
  constructor(private readonly teacherClassesService: TeacherClassesService) {}

  @Get()
  listMyClasses(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherClassesService.listMyClasses(user.userId);
  }
}
