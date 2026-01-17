import { UserRole } from "../users/user-role.enum";

export type JwtPayload = {
  sub: string; // userId (ObjectId em string)
  email: string;
  role: UserRole;
};
