import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../users/user-role.enum";

import { AdminService } from "./admin.service";
import { AdminCreateUserDto } from "./dto/admin-create-user.dto";
import { AdminResetPasswordDto } from "./dto/admin-reset-password.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { CreateTeachingAssignmentDto } from "./dto/create-teaching-assignment.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SECRETARIA)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // USERS
  @Post("users")
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Get("users")
  listUsers(@Query("role") role?: UserRole) {
    return this.adminService.listUsers(role);
  }

  @Post("users/:id/reset-password")
  resetPassword(@Param("id") id: string, @Body() dto: AdminResetPasswordDto) {
    return this.adminService.resetPassword(id, dto);
  }

  // CLASSES
  @Post("classes")
  createClass(@Body() dto: CreateClassDto) {
    return this.adminService.createClass(dto);
  }

  @Get("classes")
  listClasses() {
    return this.adminService.listClasses();
  }

  // SUBJECTS
  @Post("subjects")
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }

  @Get("subjects")
  listSubjects() {
    return this.adminService.listSubjects();
  }

  // ENROLLMENTS
  @Post("enrollments")
  enroll(@Body() dto: CreateEnrollmentDto) {
    return this.adminService.enrollStudent(dto);
  }

  @Get("classes/:classId/students")
  listClassStudents(@Param("classId") classId: string) {
    return this.adminService.listClassStudents(classId);
  }

  // TEACHING ASSIGNMENTS
  @Post("teaching-assignments")
  assignTeacher(@Body() dto: CreateTeachingAssignmentDto) {
    return this.adminService.assignTeacher(dto);
  }

  @Get("teachers/:teacherId/teaching-assignments")
  listTeacherAssignments(@Param("teacherId") teacherId: string) {
    return this.adminService.listTeacherAssignments(teacherId);
  }
}
