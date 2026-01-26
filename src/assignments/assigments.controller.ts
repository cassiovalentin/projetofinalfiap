// assignments.controller.ts
import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";
import { CurrentUser } from "../auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "../auth/dto/current-user.decorator";

import { AssignmentsService } from "./assigment.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { AutoReinforcementDto } from "./dto/auto-reinforcement.dto";
import { ManualReinforcementDto } from "./dto/manual-reinforcement.dto";
import { CreateManualReinforcementDto } from "./dto/create-manual-reinforcement.dto";
import { CreateReinforcementActivityDto } from "src/activities/dto/create-reinforcement-activity.dto";
import { AssignReinforcementActivityDto } from "src/activities/dto/assign-reinforcement-activity.dto";
@Controller()
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // =========================
  // PROFESSOR: atribuir atividade para aluno
  // =========================
  @Post("assignments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  create(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.createAssignment(dto, user.userId);
  }

  // =========================
  // PROFESSOR: listar atribuições
  // =========================
  @Get("teacher/assignments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherList(
    @CurrentUser() user: CurrentUserPayload,
    @Query("activityId") activityId?: string,
    @Query("studentId") studentId?: string,
    @Query("status") status?: string,
  ) {
    return this.assignmentsService.teacherListAssignments(user.userId, {
      activityId,
      studentId,
      status,
    });
  }

  // =========================
  // PROFESSOR: visão consolidada
  // =========================
  @Get("teacher/assignments/:assignmentId/summary")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherSummary(
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherGetAssignmentSummary(
      assignmentId,
      user.userId,
    );
  }

  // =========================
  // PROFESSOR: listar quem precisa de reforço
  // =========================
  @Get("teacher/assignments/needs-reinforcement")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  teacherNeedsReinforcement(@CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.teacherListNeedsReinforcement(user.userId);
  }

  // =========================
  // ✅ PROFESSOR: criar reforço automático para um assignment original
  // (usa AutoReinforcementDto: topics[] e questionCount)
  // =========================
  @Post("teacher/assignments/:assignmentId/reinforcement")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  createReinforcementAuto(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: AutoReinforcementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherCreateReinforcementAuto(
      assignmentId,
      user.userId,
      dto,
    );
  }

  // =========================
  // ✅ REFORÇO MANUAL (modo “criar atividade”)
  // =========================
  @Post("teacher/assignments/:assignmentId/reinforcement/manual")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  createReinforcementManual(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: CreateManualReinforcementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherCreateReinforcementManual(
      assignmentId,
      user.userId,
      dto,
    );
  }

  // =========================
  // PROFESSOR: listar reforços vinculados a um assignment original
  // =========================
  @Get("teacher/assignments/:assignmentId/reinforcements")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  listReinforcements(
    @Param("assignmentId") assignmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherListReinforcements(assignmentId, user.userId);

  }
  @Post("teacher/assignments/:assignmentId/reinforcement/manual/activity")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  createManualReinforcementActivity(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: CreateReinforcementActivityDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherCreateManualReinforcementActivity(
      assignmentId,
      user.userId,
      dto,
    );
  }

  // ✅ 2) DISPONIBILIZAR reforço usando um activityId já salvo
  @Post("teacher/assignments/:assignmentId/reinforcement/manual/assign")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  assignManualReinforcementActivity(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: AssignReinforcementActivityDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.assignmentsService.teacherAssignManualReinforcementActivity(
      assignmentId,
      user.userId,
      dto,
    );
  }


}
