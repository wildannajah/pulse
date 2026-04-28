import { Controller, Get, HttpCode, HttpException, HttpStatus } from "@nestjs/common";

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
}
