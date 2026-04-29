import type { Brand, PrismaClient, User } from "@prisma/client";

import { resolveBrand } from "../auth/brand-resolver";
import { resolveSession } from "../auth/session-resolver";

export type TrpcContext = {
  user: User | null;
  brand: Brand | null;
  brandIdHeader: string | null;
  prisma: PrismaClient;
};

export async function createTrpcContext(opts: {
  req: Request;
  prisma: PrismaClient;
}): Promise<TrpcContext> {
  const authHeader = opts.req.headers.get("authorization");
  const brandIdHeader = opts.req.headers.get("x-brand-id");

  const user = await resolveSession({ authHeader, prisma: opts.prisma });
  const brand = user ? await resolveBrand({ brandIdHeader, user, prisma: opts.prisma }) : null;

  return { user, brand, brandIdHeader, prisma: opts.prisma };
}
