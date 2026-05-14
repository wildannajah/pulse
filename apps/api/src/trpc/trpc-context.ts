import type { ConfigService } from "@nestjs/config";
import type { Brand, PrismaClient, User } from "@prisma/client";
import { resolveBrand } from "../auth/brand-resolver";
import { resolveSession } from "../auth/session-resolver";
import type { EncryptionService } from "../encryption/encryption.service";
import type { OAuthStateService } from "../platforms/oauth-state.service";
import type { R2Service } from "../storage/r2.service";

export type TrpcContext = {
  user: User | null;
  brand: Brand | null;
  brandIdHeader: string | null;
  prisma: PrismaClient;
  r2: R2Service;
  oauthState: OAuthStateService;
  config: ConfigService;
  encryption: EncryptionService;
};

export async function createTrpcContext(opts: {
  req: Request;
  prisma: PrismaClient;
  r2: R2Service;
  oauthState: OAuthStateService;
  config: ConfigService;
  encryption: EncryptionService;
}): Promise<TrpcContext> {
  const authHeader = opts.req.headers.get("authorization");
  const brandIdHeader = opts.req.headers.get("x-brand-id");

  const user = await resolveSession({ authHeader, prisma: opts.prisma });
  const brand = user ? await resolveBrand({ brandIdHeader, user, prisma: opts.prisma }) : null;

  return {
    user,
    brand,
    brandIdHeader,
    prisma: opts.prisma,
    r2: opts.r2,
    oauthState: opts.oauthState,
    config: opts.config,
    encryption: opts.encryption,
  };
}
