import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";
import { AssignmentsService } from "./assigment.service";
import { CurrentUser } from "../auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "../auth/dto/current-user.decorator";

@Controller("student/assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ALUNO)
export class StudentdAssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.listMyAssignments(user.userId);
  }

  @Get(":assignmentId")
  getOne(@Param("assignmentId") assignmentId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.getMyAssignmentById(assignmentId, user.userId);
  }
}
