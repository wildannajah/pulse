import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "@auth/core/adapters";
import type { PrismaClient } from "@prisma/client";

type PrismaUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  name: string;
  avatarUrl: string | null;
  passwordHash: string | null;
  timezone: string;
  locale: string;
  totpSecret: string | null;
  totpEnabledAt: Date | null;
  backupCodes: string[];
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function toAdapterUser(user: PrismaUser): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt,
    name: user.name,
    image: user.avatarUrl,
  };
}

export function PrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(data) {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name ?? data.email.split("@")[0] ?? data.email,
          emailVerifiedAt: data.emailVerified,
          avatarUrl: data.image ?? null,
        },
      });
      return toAdapterUser(user);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return toAdapterUser(user);
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return toAdapterUser(user);
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      if (!account) return null;
      return toAdapterUser(account.user);
    },

    async updateUser(data) {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.emailVerified !== undefined) updateData.emailVerifiedAt = data.emailVerified;
      if (data.image !== undefined) updateData.avatarUrl = data.image;

      const user = await prisma.user.update({
        where: { id: data.id },
        data: updateData,
      });
      return toAdapterUser(user);
    },

    async deleteUser(id) {
      await prisma.user.delete({ where: { id } });
    },

    async linkAccount(account) {
      await prisma.oAuthAccount.create({
        data: {
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
        },
      });
      return account as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.oAuthAccount.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    async createSession(session) {
      const created = await prisma.session.create({
        data: {
          userId: session.userId,
          sessionToken: session.sessionToken,
          expiresAt: session.expires,
        },
      });
      return {
        userId: created.userId,
        sessionToken: created.sessionToken,
        expires: created.expiresAt,
      };
    },

    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!session) return null;
      return {
        session: {
          userId: session.userId,
          sessionToken: session.sessionToken,
          expires: session.expiresAt,
        },
        user: toAdapterUser(session.user),
      };
    },

    async updateSession(session) {
      const updateData: Record<string, unknown> = {};
      if (session.userId !== undefined) updateData.userId = session.userId;
      if (session.expires !== undefined) updateData.expiresAt = session.expires;

      const updated = await prisma.session.update({
        where: { sessionToken: session.sessionToken },
        data: updateData,
      });
      return {
        userId: updated.userId,
        sessionToken: updated.sessionToken,
        expires: updated.expiresAt,
      } as AdapterSession;
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } });
    },

    async createVerificationToken(data) {
      const token = await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      };
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const deleted = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return {
          identifier: deleted.identifier,
          token: deleted.token,
          expires: deleted.expires,
        };
      } catch {
        return null;
      }
    },
  };
}
