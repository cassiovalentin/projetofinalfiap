import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SeedService } from "./seed/seed.service";  

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const seedService = app.get(SeedService);
  await seedService.run();

const port = process.env.PORT || 3000;
await app.listen(port, "0.0.0.0");

}
bootstrap();
