import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersModule } from "../users/users.module";

import { Assignment, AssignmentSchema } from "./assigment.schema";
import { AssignmentsService } from "./assigment.service";
import { AssignmentsController } from  "../assignments/assigments.controller"
import { StudentdAssignmentsController } from "../assignments/student-assignments.controller"

import { Activity, ActivitySchema } from "../activities/activity.schema";
import { Submission, SubmissionSchema } from "../submissions/submission.schema";

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
  ],
  controllers: [AssignmentsController, StudentdAssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
