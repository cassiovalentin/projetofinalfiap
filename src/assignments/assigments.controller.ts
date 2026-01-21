import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { AssignmentsService } from "./assigment.service";
import { CurrentUser } from "../auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "../auth/dto/current-user.decorator";


@Controller()
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // PROFESSOR: atribuir atividade a um aluno
  @Post("assignments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.createAssignment(dto, user.userId);
  }

  // PROFESSOR: listar atribuições (com nome do aluno e descricao da atividade)
  @Get("teacher/assignments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherList(
    @CurrentUser() user: CurrentUserPayload,
    @Query("activityId") activityId?: string,
    @Query("studentId") studentId?: string,
    @Query("status") status?: string,
  ) {
    return this.assignmentsService.teacherListAssignments(user.userId, { activityId, studentId, status });
  }

  // PROFESSOR: visão consolidada (desempenho + erros por tópico)
  @Get("teacher/assignments/:assignmentId/summary")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherSummary(
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherGetAssignmentSummary(assignmentId, user.userId);
  }
}
