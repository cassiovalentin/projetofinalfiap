import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { TeacherClassesController } from "./teacher-classes.controller";
import { TeacherClassesService } from "./teacher-classes.service";

// ✅ AJUSTE os imports para seus schemas reais
import { Class, ClassSchema } from "../..//admin/schemas/class.schema";
import {
  TeachingAssignment,
  TeachingAssignmentSchema} from "src/admin/schemas/teaching-assigment.schema";    

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Class.name, schema: ClassSchema },
      { name: TeachingAssignment.name, schema: TeachingAssignmentSchema },
    ]),
  ],
  controllers: [TeacherClassesController],
  providers: [TeacherClassesService],
})
export class TeacherClassesModule {}
