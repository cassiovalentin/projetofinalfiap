import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcrypt";
import { AppModule } from "../app.module";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../users/user.schema";
import { UserRole } from "../users/user-role.enum";

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const email = process.env.SECRETARIA_EMAIL || "secretaria@escola.com";
  const password = process.env.SECRETARIA_PASSWORD || "123456";
  const nome = process.env.SECRETARIA_NOME || "Secretaria Admin";

  const exists = await userModel.findOne({ email: email.toLowerCase().trim() }).lean();

  if (exists) {
    console.log(`[seed-secretaria] Já existe SECRETARIA: ${email}`);
    await app.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await userModel.create({
    nome,
    email: email.toLowerCase().trim(),
    role: UserRole.SECRETARIA,
    passwordHash,
  });

  console.log(`[seed-secretaria] SECRETARIA criada: ${email} senha: ${password}`);
  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
