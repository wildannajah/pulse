import { createHash } from "node:crypto";

import type { Platform } from "@pulse/types/platform";

import type {
  AdapterCredential,
  AdapterResult,
  AnalyticsSnapshot,
  BasePlatformAdapter,
  BuildAuthorizationUrlInput,
  ExchangeAuthCodeInput,
  ExchangeAuthCodeOutput,
  FetchAnalyticsInput,
  InboxItem,
  ProfileSnapshot,
  PublishInput,
  PublishOutput,
  ReplyInput,
  ReplyOutput,
} from "../base-platform-adapter";
import type {
  TwitterErrorResponse,
  TwitterTokenResponse,
  TwitterTweetResponse,
  TwitterUserResponse,
} from "./twitter-api-types";

const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const REVOKE_URL = "https://api.x.com/2/oauth2/revoke";
const USER_ME_URL = "https://api.x.com/2/users/me?user.fields=profile_image_url,url,name,username";
const TWEETS_URL = "https://api.x.com/2/tweets";
const AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const SCOPES = "tweet.read tweet.write users.read offline.access";

type TwitterAdapterConfig = {
  clientId: string;
  clientSecret: string;
};

export class TwitterAdapter implements BasePlatformAdapter {
  readonly platform: Platform = "twitter";

  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config: TwitterAdapterConfig) {
    if (!config.clientId) throw new Error("TwitterAdapter: TWITTER_CLIENT_ID is required");
    if (!config.clientSecret) throw new Error("TwitterAdapter: TWITTER_CLIENT_SECRET is required");
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // OAuth lifecycle
  // ────────────────────────────────────────────────────────────────────────────

  buildAuthorizationUrl(input: BuildAuthorizationUrlInput): AdapterResult<{ url: string }> {
    const { state, redirectUri, codeVerifier } = input;

    if (!codeVerifier) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message: "Twitter OAuth requires a PKCE code verifier",
        },
      };
    }

    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return { ok: true, value: { url: `${AUTH_URL}?${params.toString()}` } };
  }

  async exchangeAuthCode(
    input: ExchangeAuthCodeInput,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    const { code, redirectUri, codeVerifier } = input;

    const body = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      client_id: this.clientId,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });

    const tokenResult = await this.postForm<TwitterTokenResponse>(TOKEN_URL, body);
    if (!tokenResult.ok) return tokenResult;

    const tokens = tokenResult.value;

    const profileResult = await this.getUser(tokens.access_token);
    if (!profileResult.ok) return profileResult;

    const user = profileResult.value;
    const scopes = tokens.scope.split(" ");

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    return {
      ok: true,
      value: {
        credential: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          expiresAt,
          externalAccountId: user.id,
          scopes,
        },
        profile: {
          platformUserId: user.id,
          platformUsername: user.username,
          displayName: user.name,
          avatarUrl: user.profile_image_url,
          profileUrl: `https://x.com/${user.username}`,
          platformPageId: undefined,
        },
      },
    };
  }

  async refreshToken(credential: AdapterCredential): Promise<AdapterResult<AdapterCredential>> {
    if (!credential.refreshToken) {
      return {
        ok: false,
        error: {
          kind: "auth_expired",
          message: "No refresh token available; user must reconnect",
        },
      };
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credential.refreshToken,
      client_id: this.clientId,
    });

    const tokenResult = await this.postForm<TwitterTokenResponse>(TOKEN_URL, body);
    if (!tokenResult.ok) return tokenResult;

    const tokens = tokenResult.value;
    const scopes = tokens.scope.split(" ");
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    return {
      ok: true,
      value: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? credential.refreshToken,
        expiresAt,
        externalAccountId: credential.externalAccountId,
        scopes,
      },
    };
  }

  async revokeToken(credential: AdapterCredential): Promise<AdapterResult<void>> {
    const body = new URLSearchParams({
      token: credential.accessToken,
      token_type_hint: "access_token",
    });

    const result = await this.postForm<unknown>(REVOKE_URL, body);
    if (!result.ok) return result;
    return { ok: true, value: undefined };
  }

  async fetchProfile(credential: AdapterCredential): Promise<AdapterResult<ProfileSnapshot>> {
    const userResult = await this.getUser(credential.accessToken);
    if (!userResult.ok) return userResult;

    const user = userResult.value;
    return {
      ok: true,
      value: {
        displayName: user.name,
        handle: user.username,
        avatarUrl: user.profile_image_url ?? null,
        followerCount: 0,
      },
    };
  }

  async publish(
    credential: AdapterCredential,
    input: PublishInput,
  ): Promise<AdapterResult<PublishOutput>> {
    if (input.media.length > 0) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message:
            "Media uploads are not yet supported for Twitter. Phase C is text-only. Media support lands in a follow-up.",
        },
      };
    }

    let raw: unknown;
    try {
      const resp = await fetch(TWEETS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input.text }),
      });

      raw = await resp.json().catch(() => null);

      if (resp.status === 401) {
        return {
          ok: false,
          error: { kind: "auth_expired", message: "Twitter token is expired or revoked", raw },
        };
      }

      if (resp.status === 429) {
        const retryAfter = resp.headers.get("retry-after");
        return {
          ok: false,
          error: {
            kind: "rate_limited",
            message: "Twitter API rate limit exceeded",
            raw,
            retryAfterSeconds: retryAfter ? Number(retryAfter) : 60,
          },
        };
      }

      if (!resp.ok) {
        const err = raw as TwitterErrorResponse | null;
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: err?.detail ?? err?.title ?? `Twitter returned HTTP ${resp.status}`,
            raw,
          },
        };
      }

      const body = raw as TwitterTweetResponse;
      return {
        ok: true,
        value: {
          externalPostId: body.data.id,
          externalUrl: `https://x.com/i/web/status/${body.data.id}`,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: {
          kind: "network_error",
          message: err instanceof Error ? err.message : "Unknown network error",
          raw: err,
        },
      };
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Not in scope for Phase C
  // ────────────────────────────────────────────────────────────────────────────

  async fetchAnalytics(
    _credential: AdapterCredential,
    _input: FetchAnalyticsInput,
  ): Promise<AdapterResult<AnalyticsSnapshot>> {
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: "fetchAnalytics not implemented for Twitter (Phase F)",
      },
    };
  }

  async fetchInbox(
    _credential: AdapterCredential,
    _sinceExternalId: string | null,
  ): Promise<AdapterResult<InboxItem[]>> {
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: "fetchInbox not implemented for Twitter (Phase G)",
      },
    };
  }

  async reply(
    _credential: AdapterCredential,
    _input: ReplyInput,
  ): Promise<AdapterResult<ReplyOutput>> {
    return {
      ok: false,
      error: { kind: "platform_error", message: "reply not implemented for Twitter (Phase G)" },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────────────────────────────────

  private get basicAuth(): string {
    return Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
  }

  private async postForm<T>(url: string, body: URLSearchParams): Promise<AdapterResult<T>> {
    let raw: unknown;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      raw = await resp.json().catch(() => null);

      if (resp.status === 401) {
        return {
          ok: false,
          error: { kind: "auth_expired", message: "Twitter credentials rejected", raw },
        };
      }

      if (resp.status === 429) {
        const retryAfter = resp.headers.get("retry-after");
        return {
          ok: false,
          error: {
            kind: "rate_limited",
            message: "Twitter API rate limit exceeded",
            raw,
            retryAfterSeconds: retryAfter ? Number(retryAfter) : 60,
          },
        };
      }

      if (!resp.ok) {
        const err = raw as TwitterErrorResponse | null;
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: err?.error_description ?? err?.error ?? `Twitter returned HTTP ${resp.status}`,
            raw,
          },
        };
      }

      return { ok: true, value: raw as T };
    } catch (err) {
      return {
        ok: false,
        error: {
          kind: "network_error",
          message: err instanceof Error ? err.message : "Unknown network error",
          raw: err,
        },
      };
    }
  }

  private async getUser(
    accessToken: string,
  ): Promise<
    AdapterResult<{ id: string; name: string; username: string; profile_image_url?: string }>
  > {
    let raw: unknown;
    try {
      const resp = await fetch(USER_ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      raw = await resp.json().catch(() => null);

      if (resp.status === 401) {
        return {
          ok: false,
          error: {
            kind: "auth_expired",
            message: "Twitter token rejected when fetching profile",
            raw,
          },
        };
      }

      if (!resp.ok) {
        const err = raw as TwitterErrorResponse | null;
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: err?.detail ?? err?.title ?? `Twitter /users/me returned HTTP ${resp.status}`,
            raw,
          },
        };
      }

      const body = raw as TwitterUserResponse;
      return { ok: true, value: body.data };
    } catch (err) {
      return {
        ok: false,
        error: {
          kind: "network_error",
          message: err instanceof Error ? err.message : "Unknown network error",
          raw: err,
        },
      };
    }
  }
}
