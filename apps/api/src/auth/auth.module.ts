import { Module } from "@nestjs/common";
import { BrandScopeGuard } from "./brand-scope.guard";
import { SessionGuard } from "./session.guard";

@Module({
  providers: [SessionGuard, BrandScopeGuard],
  exports: [SessionGuard, BrandScopeGuard],
})
export class AuthModule {}
