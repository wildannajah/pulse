import { Module } from "@nestjs/common";

import { TrpcController } from "./trpc.controller";

// TrpcController injects OAuthStateService (provided by PlatformsModule, which is @Global)
// and ConfigService (provided by ConfigModule, which is @Global) — no extra imports needed.
@Module({
  controllers: [TrpcController],
})
export class TrpcModule {}
