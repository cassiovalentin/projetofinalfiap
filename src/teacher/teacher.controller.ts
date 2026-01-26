import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "../auth/dto/current-user.decorator"; 
import { UserRole } from "../users/user-role.enum";

import { TeacherService } from "./teacher.service";
import { TeacherCreateActivityDto } from "./dto/teacher-create-activity.dto";
import { AssignActivityToClassDto } from "./dto/assign-activity-to-class.dto";

@Controller("teacher")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROFESSOR)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get("activities")
  listMyActivities(@CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.listMyActivities(user.userId);
  }

  // ✅ ESTA É A ROTA QUE ESTÁ FALTANDO NO SEU BACKEND
  @Post("activities")
  createActivity(@Body() dto: TeacherCreateActivityDto, @CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.createActivity(dto, user.userId);
  }

  @Post("assignments/class")
  assignToClass(@Body() dto: AssignActivityToClassDto, @CurrentUser() user: CurrentUserPayload) {
    return this.teacherService.assignActivityToClass(dto, user.userId);
  }
}
