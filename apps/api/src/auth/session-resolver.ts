import type { PrismaClient, User } from "@prisma/client";

export async function resolveSession(opts: {
  authHeader: string | null | undefined;
  prisma: PrismaClient;
}): Promise<User | null> {
  if (!opts.authHeader) return null;

  const match = opts.authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];

  const session = await opts.prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.user;
}
