import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersModule } from "./users/users.module"
import { AuthModule } from "./auth/auth.module";
import { ActivitiesModule } from "./activities/activities.module";
import { AssignmentsModule } from "./assignments/assigments.module";    
import { SubmissionsModule } from "./submissions/submissions.module"; 
import { AdminModule } from "./admin/admin.module";
import { TeacherModule } from "./teacher/teacher.module";
import { TeacherClassesModule } from "./teacher/class/teacher-classes.module";
import { SeedModule } from "./seed/seed.module";


// MongooseModule.forRoot("mongodb://localhost:27017/escola")

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    UsersModule,
    AuthModule,
    ActivitiesModule,
    AssignmentsModule,  
    SubmissionsModule,
    AdminModule,
  TeacherModule,
  TeacherClassesModule,
  SeedModule,
  ],
})
export class AppModule {}
