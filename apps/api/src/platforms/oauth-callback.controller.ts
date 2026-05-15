import { Controller, Get, Logger, Param, Query, Res } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { ConfigService } from "@nestjs/config";
import type { Platform as PrismaEnumPlatform } from "@prisma/client";
import type { Platform } from "@pulse/types/platform";
import { PLATFORM_LIST } from "@pulse/types/platform";
import type { Response } from "express";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { EncryptionService } from "../encryption/encryption.service";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { PrismaService } from "../prisma/prisma.service";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { RedisService } from "../redis/redis.service";
import { getAdapter } from "./adapter-registry";
// biome-ignore lint/style/useImportType: NestJS DI needs the runtime class for emitDecoratorMetadata
import { OAuthStateService } from "./oauth-state.service";

@Controller("oauth")
export class OAuthCallbackController {
  private readonly logger = new Logger(OAuthCallbackController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly oauthState: OAuthStateService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  @Get(":platform/callback")
  async handleCallback(
    @Param("platform") platformParam: string,
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Query("oauth_token") oauthToken: string | undefined,
    @Query("oauth_verifier") oauthVerifier: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const webOrigin = this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";
    const connectionsBase = `${webOrigin}/app/settings/connections`;

    const redirect = (params: Record<string, string>): void => {
      const qs = new URLSearchParams(params).toString();
      res.redirect(302, `${connectionsBase}?${qs}`);
    };

    try {
      // Step 1 — validate platform param
      if (!PLATFORM_LIST.includes(platformParam as Platform)) {
        return redirect({ status: "error", reason: "invalid_platform" });
      }
      const platform = platformParam as Platform;

      // Step 2 — check for platform-issued denial
      if (error) {
        this.logger.warn(
          `Platform ${platform} denied authorization: ${error} — ${errorDescription ?? "no description"}`,
        );
        return redirect({ status: "error", reason: "platform_denied", platform });
      }

      const adapter = getAdapter(platform);
      const isOAuth1Callback = Boolean(oauthToken && oauthVerifier);

      // ── OAuth 1.0a callback path ──────────────────────────────────────────
      if (isOAuth1Callback && adapter.exchangeOAuth1Verifier) {
        const redisKey = `oauth1:req:${oauthToken}`;
        const stored = await this.redis.get(redisKey);

        if (!stored) {
          this.logger.warn(
            `OAuth 1.0a request token not found in Redis for platform=${platform} oauth_token=${oauthToken}`,
          );
          return redirect({ status: "error", reason: "state_not_found" });
        }

        // One-time use — delete immediately before proceeding
        await this.redis.del(redisKey);

        let parsedStored: { requestTokenSecret: string; brandId: string; userId: string };
        try {
          parsedStored = JSON.parse(stored) as typeof parsedStored;
        } catch {
          this.logger.error(`Failed to parse OAuth 1.0a stored state for platform=${platform}`);
          return redirect({ status: "error", reason: "state_not_found" });
        }

        const { requestTokenSecret, brandId, userId } = parsedStored;

        const exchangeResult = await adapter.exchangeOAuth1Verifier(
          oauthToken as string,
          requestTokenSecret,
          oauthVerifier as string,
        );

        if (!exchangeResult.ok) {
          this.logger.error(
            `OAuth 1.0a verifier exchange failed for platform=${platform} kind=${exchangeResult.error.kind}`,
            exchangeResult.error.raw,
          );
          return redirect({ status: "error", reason: "exchange_failed", platform });
        }

        return this.upsertConnectedAccount({
          exchangeResult: exchangeResult.value,
          platform,
          brandId,
          userId,
          redirect,
        });
      }

      // ── OAuth 2.0 callback path ───────────────────────────────────────────

      // Require code + state
      if (!code || !state) {
        return redirect({ status: "error", reason: "missing_params" });
      }

      // Verify state token
      let statePayload: ReturnType<OAuthStateService["verify"]>;
      try {
        statePayload = this.oauthState.verify(state);
      } catch (err) {
        this.logger.warn(
          `Invalid OAuth state token: ${err instanceof Error ? err.message : String(err)}`,
        );
        return redirect({ status: "error", reason: "invalid_state" });
      }

      if (statePayload.platform !== platform) {
        this.logger.warn(
          `Platform mismatch: state token platform=${statePayload.platform}, URL platform=${platform}`,
        );
        return redirect({ status: "error", reason: "platform_mismatch" });
      }

      const { brandId, userId, codeVerifier } = statePayload;

      const apiUrl = this.config.get<string>("API_URL") ?? "http://localhost:3001";
      const redirectUri = `${apiUrl}/oauth/${platform}/callback`;
      const exchangeResult = await adapter.exchangeAuthCode({ code, redirectUri, codeVerifier });

      if (!exchangeResult.ok) {
        this.logger.error(
          `Token exchange failed for platform=${platform} kind=${exchangeResult.error.kind}`,
          exchangeResult.error.raw,
        );
        return redirect({ status: "error", reason: "exchange_failed", platform });
      }

      return this.upsertConnectedAccount({
        exchangeResult: exchangeResult.value,
        platform,
        brandId,
        userId,
        redirect,
      });
    } catch (err) {
      this.logger.error("Unexpected error in OAuth callback", err);
      return redirect({ status: "error", reason: "unknown" });
    }
  }

  private async upsertConnectedAccount(opts: {
    exchangeResult: {
      credential: {
        accessToken: string;
        refreshToken: string | null;
        expiresAt: string | null;
        externalAccountId: string;
        scopes?: readonly string[];
      };
      profile: {
        platformUserId: string;
        platformUsername: string;
        platformPageId?: string;
        displayName?: string;
        avatarUrl?: string;
        profileUrl?: string;
      };
    };
    platform: Platform;
    brandId: string;
    userId: string;
    redirect: (params: Record<string, string>) => void;
  }): Promise<void> {
    const { exchangeResult, platform, brandId, userId, redirect } = opts;
    const { credential, profile } = exchangeResult;

    const encryptedAccessToken = this.encryption.encrypt(credential.accessToken);
    const encryptedRefreshToken = credential.refreshToken
      ? this.encryption.encrypt(credential.refreshToken)
      : null;

    const prismaEnumPlatform = platform.toUpperCase() as PrismaEnumPlatform;

    await this.prisma.connectedAccount.upsert({
      where: {
        brandId_platform_platformUserId: {
          brandId,
          platform: prismaEnumPlatform,
          platformUserId: profile.platformUserId,
        },
      },
      create: {
        brandId,
        platform: prismaEnumPlatform,
        platformUserId: profile.platformUserId,
        platformUsername: profile.platformUsername,
        platformPageId: profile.platformPageId ?? null,
        displayName: profile.displayName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        profileUrl: profile.profileUrl ?? null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: credential.expiresAt ? new Date(credential.expiresAt) : null,
        scopes: credential.scopes ? [...credential.scopes] : [],
        status: "ACTIVE",
        connectedById: userId,
        lastSyncedAt: new Date(),
      },
      update: {
        platformUsername: profile.platformUsername,
        platformPageId: profile.platformPageId ?? null,
        displayName: profile.displayName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        profileUrl: profile.profileUrl ?? null,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: credential.expiresAt ? new Date(credential.expiresAt) : null,
        scopes: credential.scopes ? [...credential.scopes] : [],
        status: "ACTIVE",
        errorCount: 0,
        lastErrorAt: null,
        lastErrorMessage: null,
        lastSyncedAt: new Date(),
      },
    });

    redirect({
      status: "success",
      platform,
      account: profile.platformUsername,
    });
  }
}
