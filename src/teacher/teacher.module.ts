import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { TeacherController } from "./teacher.controller";
import { TeacherService } from "./teacher.service";

import { Activity, ActivitySchema } from "../activities/activity.schema";
import { AssignmentsModule } from   "../assignments/assigments.module";
import { Enrollment, EnrollmentSchema } from "../admin/schemas/enrollment.schema";
import { TeachingAssignment, TeachingAssignmentSchema } from "../admin/schemas/teaching-assigment.schema";

@Module({
  imports: [
    AssignmentsModule,
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: TeachingAssignment.name, schema: TeachingAssignmentSchema },
    ]),
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
