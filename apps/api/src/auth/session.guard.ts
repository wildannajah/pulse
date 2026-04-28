import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedException("Invalid authorization header format");
    }

    const token = parts[1];

    const session = await this.prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException("Invalid session token");
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired");
    }

    (request as unknown as Record<string, unknown>).user = session.user;

    return true;
  }
}
