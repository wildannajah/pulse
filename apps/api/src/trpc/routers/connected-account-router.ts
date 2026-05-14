import { randomBytes } from "node:crypto";
import type { Platform } from "@pulse/types/platform";
import { PlatformEnum } from "@pulse/types/platform";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getAdapter } from "../../platforms/adapter-registry";
import { brandProcedure, router } from "../trpc";

export const connectedAccountRouter = router({
  /**
   * Begin an OAuth flow for the active brand.
   * Returns the platform's authorization URL; the caller does
   * `window.location = authorizationUrl` to kick off the redirect.
   */
  startOAuth: brandProcedure
    .input(z.object({ platform: PlatformEnum }))
    .mutation(async ({ ctx, input }) => {
      const { platform } = input;
      const apiUrl = ctx.config.get<string>("API_URL") ?? "http://localhost:3001";
      const redirectUri = `${apiUrl}/oauth/${platform}/callback`;

      // Generate a PKCE code verifier for every platform.
      // Adapters that don't use PKCE will ignore it; PKCE adapters (Twitter/X) will use it.
      const codeVerifier = randomBytes(48).toString("base64url");

      const state = ctx.oauthState.sign({
        brandId: ctx.brand.id,
        userId: ctx.user.id,
        platform,
        codeVerifier,
      });

      const adapter = getAdapter(platform);
      const result = adapter.buildAuthorizationUrl({ state, redirectUri, codeVerifier });

      if (!result.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to build authorization URL for ${platform}: ${result.error.message}`,
        });
      }

      return { authorizationUrl: result.value.url };
    }),

  /**
   * List all connected accounts for the active brand.
   * Never returns accessToken or refreshToken.
   */
  list: brandProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.connectedAccount.findMany({
      where: { brandId: ctx.brand.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    return accounts.map((account) => ({
      id: account.id,
      platform: account.platform.toLowerCase() as Platform,
      platformUsername: account.platformUsername,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl,
      profileUrl: account.profileUrl,
      status: account.status,
      tokenExpiresAt: account.tokenExpiresAt,
      createdAt: account.createdAt,
    }));
  }),

  /**
   * Revoke the platform token and delete the connected account row.
   * Revocation is best-effort — if the platform rejects it (already revoked,
   * network error, etc.) we still delete the row.
   */
  disconnect: brandProcedure
    .input(z.object({ connectedAccountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.connectedAccount.findFirst({
        where: { id: input.connectedAccountId, brandId: ctx.brand.id },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connected account not found" });
      }

      const platform = account.platform.toLowerCase() as Platform;
      const adapter = getAdapter(platform);

      const decryptedAccessToken = ctx.encryption.decrypt(account.accessToken);
      const decryptedRefreshToken = account.refreshToken
        ? ctx.encryption.decrypt(account.refreshToken)
        : null;

      const revokeResult = await adapter.revokeToken({
        accessToken: decryptedAccessToken,
        refreshToken: decryptedRefreshToken,
        expiresAt: account.tokenExpiresAt?.toISOString() ?? null,
        externalAccountId: account.platformUserId,
        scopes: account.scopes,
      });

      if (!revokeResult.ok) {
        // Log but don't fail — the row is deleted regardless.
        // The platform may have already invalidated the token server-side.
        console.warn(
          `[connectedAccount.disconnect] revokeToken for ${platform} account=${account.id} failed: ${revokeResult.error.message}`,
        );
      }

      await ctx.prisma.connectedAccount.delete({ where: { id: account.id } });

      return { ok: true };
    }),
});
