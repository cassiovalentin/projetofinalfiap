import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { ActivitiesService } from "./activities.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";

@Controller("activities")
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSOR)
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  findAll() {
    return this.activitiesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.activitiesService.findOne(id);
  }
}
