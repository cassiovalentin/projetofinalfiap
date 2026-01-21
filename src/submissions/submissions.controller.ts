import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";
import { CurrentUser } from "../auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "../auth/dto/current-user.decorator";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";
import { SubmissionsService } from "./submissions.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  // ALUNO envia respostas
  @Post("student/assignments/:assignmentId/submit")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ALUNO)
  submit(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.submissionsService.submitAssignment(assignmentId, user.userId, dto);
  }

  // PROFESSOR: dashboard de respostas
  @Get("teacher/submissions")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherList(@CurrentUser() user: CurrentUserPayload) {
    return this.submissionsService.teacherListSubmissions(user.userId);
  }

  // PROFESSOR: ver respostas de um assignment específico
  @Get("teacher/assignments/:assignmentId/submission")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherGetOne(@Param("assignmentId") assignmentId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.submissionsService.teacherGetSubmissionByAssignment(assignmentId, user.userId);
  }
}
