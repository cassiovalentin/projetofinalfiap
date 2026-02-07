import { Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user-role.enum";

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly usersService: UsersService) {}

  private envBool(name: string, def = false) {
    const v = (process.env[name] || "").toLowerCase();
    if (!v) return def;
    return v === "true" || v === "1" || v === "yes";
  }

  async run() {
    if (!this.envBool("SEED_ENABLED", false)) {
      this.logger.log("SEED desabilitado.");
      return;
    }

    await this.ensureUser({
      nome: process.env.SEED_SECRETARIA_NAME || "Secretaria",
      email: process.env.SEED_SECRETARIA_EMAIL || "secretaria@escola.com",
      password: process.env.SEED_SECRETARIA_PASSWORD || "Secret@123",
      role: UserRole.SECRETARIA,
    });

    await this.ensureUser({
      nome: process.env.SEED_PROFESSOR_NAME || "Professor",
      email: process.env.SEED_PROFESSOR_EMAIL || "prof@escola.com",
      password: process.env.SEED_PROFESSOR_PASSWORD || "Prof@123",
      role: UserRole.PROFESSOR,
    });

    await this.ensureUser({
      nome: process.env.SEED_ALUNO_NAME || "Aluno",
      email: process.env.SEED_ALUNO_EMAIL || "aluno@escola.com",
      password: process.env.SEED_ALUNO_PASSWORD || "Aluno@123",
      role: UserRole.ALUNO,
    });
  }

  private async ensureUser(dto: {
    nome: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      this.logger.log(`Seed: já existe ${dto.email}`);
      return;
    }

    await this.usersService.create(dto as any);
    this.logger.log(`Seed: criado ${dto.email} (${dto.role})`);
  }
}
