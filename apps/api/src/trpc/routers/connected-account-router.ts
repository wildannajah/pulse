import { randomBytes } from "node:crypto";
import { PlatformEnum } from "@pulse/types/platform";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getAdapter } from "../../platforms/adapter-registry";
import { brandProcedure, router } from "../trpc";

/**
 * connectedAccount router — Phase B ships only `startOAuth`.
 * Remaining procedures (list, disconnect, refreshNow) land in Phase C / G.
 */
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
});
