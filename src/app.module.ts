import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersModule } from "./users/users.module"
import { AuthModule } from "./auth/auth.module";
import { ActivitiesModule } from "./activities/activities.module";
import { AssignmentsModule } from "./assignments/assigments.module";    
import { SubmissionsModule } from "./submissions/submissions.module"; 




@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost:27017/escola"),
    UsersModule,
    AuthModule,
    ActivitiesModule,
    AssignmentsModule,  
    SubmissionsModule
  ],
})
export class AppModule {}
