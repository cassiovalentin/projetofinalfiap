import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { UserRole } from "./user-role.enum";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, maxlength: 120 })
  nome: string;

  @Prop({ required: true, unique: true, maxlength: 160 })
  email: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true, select: false })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
// REMOVA esta linha se existir:
// UserSchema.index({ email: 1 }, { unique: true });
