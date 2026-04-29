import type { Brand, PrismaClient, User } from "@prisma/client";

export async function resolveBrand(opts: {
  brandIdHeader: string | null | undefined;
  user: User;
  prisma: PrismaClient;
}): Promise<Brand | null> {
  if (!opts.brandIdHeader) return null;

  const brand = await opts.prisma.brand.findUnique({
    where: { id: opts.brandIdHeader },
  });
  if (!brand) return null;

  const membership = await opts.prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: brand.workspaceId,
        userId: opts.user.id,
      },
    },
  });
  if (!membership) return null;

  if (membership.brandAccess.length > 0 && !membership.brandAccess.includes(brand.id)) {
    return null;
  }

  return brand;
}
