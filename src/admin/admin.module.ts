import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

import { User, UserSchema } from "../users/user.schema";

import { Class, ClassSchema } from "./schemas/class.schema";
import { Subject, SubjectSchema } from "./schemas/subject.schema";
import { Enrollment, EnrollmentSchema } from "./schemas/enrollment.schema";
import { TeachingAssignment, TeachingAssignmentSchema } from "./schemas/teaching-assigment.schema"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: TeachingAssignment.name, schema: TeachingAssignmentSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
