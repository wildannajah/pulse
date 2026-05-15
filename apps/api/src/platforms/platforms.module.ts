import { Global, Module } from "@nestjs/common";

import { RedisModule } from "../redis/redis.module";
import { OAuthCallbackController } from "./oauth-callback.controller";
import { OAuthStateService } from "./oauth-state.service";

@Global()
@Module({
  imports: [RedisModule],
  controllers: [OAuthCallbackController],
  providers: [OAuthStateService],
  exports: [OAuthStateService],
})
export class PlatformsModule {}
