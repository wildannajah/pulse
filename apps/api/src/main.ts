import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import type { Env } from "./config/env-schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.enableCors({
    origin: config.get("WEB_ORIGIN", { infer: true }),
    credentials: true,
  });
  app.enableShutdownHooks();

  const port = config.get("PORT", { infer: true });
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}`, "Bootstrap");
}

void bootstrap();
