import { Global, Module } from "@nestjs/common";

import { OAuthCallbackController } from "./oauth-callback.controller";
import { OAuthStateService } from "./oauth-state.service";

@Global()
@Module({
  controllers: [OAuthCallbackController],
  providers: [OAuthStateService],
  exports: [OAuthStateService],
})
export class PlatformsModule {}
