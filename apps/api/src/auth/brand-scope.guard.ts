import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { User } from "@prisma/client";
import type { Request } from "express";

// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";
import { resolveBrand } from "./brand-resolver";

@Injectable()
export class BrandScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const brandIdHeader = request.headers["x-brand-id"];

    if (!brandIdHeader || typeof brandIdHeader !== "string") {
      throw new BadRequestException("Missing x-brand-id header");
    }

    const user = (request as unknown as Record<string, unknown>).user as User | undefined;
    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    const brand = await resolveBrand({
      brandIdHeader,
      user,
      prisma: this.prisma,
    });
    if (!brand) {
      throw new ForbiddenException("Brand not accessible");
    }

    (request as unknown as Record<string, unknown>).brand = brand;
    return true;
  }
}
