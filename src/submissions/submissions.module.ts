import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Submission, SubmissionSchema } from "./submission.schema";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { AssignmentsModule } from "../assignments/assigments.module";
import { Activity, ActivitySchema } from "../activities/activity.schema"; // ajuste caminho

@Module({
  imports: [
    AssignmentsModule,
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
