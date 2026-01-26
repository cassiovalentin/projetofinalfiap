import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";
import { AssignmentsService } from "./assigment.service";
import { CurrentUser } from "../auth/dto/current-user.decorator";
import type { CurrentUserPayload } from "../auth/dto/current-user.decorator";
import { AutoReinforcementDto } from "./dto/auto-reinforcement.dto";

@Controller("teacher/assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROFESSOR)
export class TeacherAssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * 🔁 Criar atividade de reforço AUTOMÁTICA
   * POST /teacher/assignments/:assignmentId/reinforcement/auto
   */
  @Post(":assignmentId/reinforcement/auto")
  createAutoReinforcement(
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
}
