import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BrandScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const brandId = request.headers["x-brand-id"];

    if (!brandId || typeof brandId !== "string") {
      throw new BadRequestException("Missing x-brand-id header");
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { workspace: true },
    });

    if (!brand) {
      throw new ForbiddenException("Brand not found or access denied");
    }

    const user = (request as unknown as Record<string, unknown>).user as { id: string } | undefined;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: brand.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("Access denied to this brand");
    }

    // If brandAccess is non-empty, the brand must be in the list
    if (membership.brandAccess.length > 0 && !membership.brandAccess.includes(brandId)) {
      throw new ForbiddenException("Access denied to this brand");
    }

    (request as unknown as Record<string, unknown>).brand = brand;

    return true;
  }
}
