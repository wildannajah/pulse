import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";
import { resolveSession } from "./session-resolver";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    const user = await resolveSession({ authHeader, prisma: this.prisma });
    if (!user) {
      throw new UnauthorizedException("Invalid or missing session");
    }

    (request as unknown as Record<string, unknown>).user = user;
    return true;
  }
}
