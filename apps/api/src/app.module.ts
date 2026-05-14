import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { validateEnv } from "./config/env-schema";
import { EncryptionModule } from "./encryption/encryption.module";
import { HealthModule } from "./health/health.module";
import { PlatformsModule } from "./platforms/platforms.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QueuesModule } from "./queues/queues.module";
import { StorageModule } from "./storage/storage.module";
import { TrpcModule } from "./trpc/trpc.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    EncryptionModule,
    StorageModule,
    PlatformsModule,
    QueuesModule,
    HealthModule,
    TrpcModule,
  ],
})
export class AppModule {}
