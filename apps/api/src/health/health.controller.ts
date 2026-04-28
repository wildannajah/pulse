import { Controller, Get, HttpCode, HttpException, HttpStatus, UseGuards } from "@nestjs/common";

import { BrandScopeGuard } from "../auth/brand-scope.guard";
import { CurrentBrand } from "../auth/decorators/current-brand.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  check() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("db")
  @HttpCode(200)
  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up", timestamp: new Date().toISOString() };
    } catch (err) {
      throw new HttpException(
        { status: "error", db: "down", error: (err as Error).message },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: { id: string; email: string }) {
    return { id: user.id, email: user.email };
  }

  @Get("brand")
  @UseGuards(SessionGuard, BrandScopeGuard)
  brand(@CurrentBrand() brand: { id: string; name: string }) {
    return { id: brand.id, name: brand.name };
  }
}
