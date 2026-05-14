import type { Platform } from "@pulse/types/platform";

import type {
  AdapterCredential,
  AdapterError,
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
  MetaErrorResponse,
  MetaFacebookFeedPublishResponse,
  MetaFacebookPageDetailResponse,
  MetaInstagramAccountResponse,
  MetaLongLivedTokenResponse,
  MetaPagesListResponse,
  MetaPageWithInstagramResponse,
  MetaShortLivedTokenResponse,
} from "./meta-api-types";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const AUTH_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_messaging",
  "business_management",
].join(",");

const INSTAGRAM_SCOPES = [
  "pages_show_list",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_comments",
  "instagram_manage_insights",
].join(",");

type MetaAdapterConfig = {
  platform: "facebook" | "instagram";
  appId: string;
  appSecret: string;
};

export class MetaAdapter implements BasePlatformAdapter {
  readonly platform: Platform;

  private readonly appId: string;
  private readonly appSecret: string;

  constructor(config: MetaAdapterConfig) {
    if (!config.appId) throw new Error("MetaAdapter: META_APP_ID is required");
    if (!config.appSecret) throw new Error("MetaAdapter: META_APP_SECRET is required");
    this.platform = config.platform;
    this.appId = config.appId;
    this.appSecret = config.appSecret;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // OAuth lifecycle
  // ────────────────────────────────────────────────────────────────────────────

  buildAuthorizationUrl(input: BuildAuthorizationUrlInput): AdapterResult<{ url: string }> {
    const { state, redirectUri } = input;
    // No PKCE — Meta OAuth does not use code_verifier

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
      scope: this.platform === "facebook" ? FACEBOOK_SCOPES : INSTAGRAM_SCOPES,
      response_type: "code",
    });

    return { ok: true, value: { url: `${AUTH_BASE}?${params.toString()}` } };
  }

  async exchangeAuthCode(
    input: ExchangeAuthCodeInput,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    const { code, redirectUri } = input;

    // Step 1 — short-lived user token
    const shortLivedResult = await this.getJson<MetaShortLivedTokenResponse>(
      `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: redirectUri,
        code,
      }).toString()}`,
    );
    if (!shortLivedResult.ok) return shortLivedResult;
    const shortLivedToken = shortLivedResult.value.access_token;

    // Step 2 — long-lived user token
    const longLivedResult = await this.getJson<MetaLongLivedTokenResponse>(
      `${GRAPH_BASE}/oauth/access_token?${new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      }).toString()}`,
    );
    if (!longLivedResult.ok) return longLivedResult;

    const longLivedToken = longLivedResult.value.access_token;
    const expiresAt = new Date(Date.now() + longLivedResult.value.expires_in * 1000).toISOString();

    // Step 3 — list user's Pages
    const pagesResult = await this.getJson<MetaPagesListResponse>(
      `${GRAPH_BASE}/me/accounts?${new URLSearchParams({
        access_token: longLivedToken,
        fields: "id,name,access_token,category,tasks",
      }).toString()}`,
    );
    if (!pagesResult.ok) return pagesResult;

    const pages = pagesResult.value.data;
    if (pages.length === 0) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message: "No Facebook Pages found. Create or be added to a Page first.",
        },
      };
    }

    if (this.platform === "facebook") {
      return this.exchangeForFacebook(pages, expiresAt);
    }

    return this.exchangeForInstagram(pages, expiresAt);
  }

  async refreshToken(_credential: AdapterCredential): Promise<AdapterResult<AdapterCredential>> {
    // Meta long-lived tokens don't refresh via standard OAuth.
    // Token-refresh worker marks account EXPIRED, user reconnects manually.
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: "Meta long-lived tokens do not refresh via OAuth. Reconnection required.",
      },
    };
  }

  async revokeToken(credential: AdapterCredential): Promise<AdapterResult<void>> {
    try {
      await fetch(
        `${GRAPH_BASE}/me/permissions?${new URLSearchParams({
          access_token: credential.accessToken,
        }).toString()}`,
        { method: "DELETE" },
      );
    } catch {
      // Best-effort — silently ignore errors
    }
    return { ok: true, value: undefined };
  }

  async fetchProfile(_credential: AdapterCredential): Promise<AdapterResult<ProfileSnapshot>> {
    // fetchProfile needs the platform user ID which isn't on the credential.
    // Will be addressed when BasePlatformAdapter.fetchProfile is extended to accept it explicitly.
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: "fetchProfile pending BasePlatformAdapter signature update",
      },
    };
  }

  async publish(
    credential: AdapterCredential,
    input: PublishInput,
  ): Promise<AdapterResult<PublishOutput>> {
    if (this.platform === "facebook") {
      if (input.media.length > 0) {
        return {
          ok: false,
          error: {
            kind: "validation_failed",
            message: "Media uploads land in a follow-up. v1 is text-only.",
          },
        };
      }

      if (!input.platformPageId) {
        return {
          ok: false,
          error: {
            kind: "validation_failed",
            message: "platformPageId is required for Facebook publish",
          },
        };
      }

      let raw: unknown;
      try {
        const resp = await fetch(
          `${GRAPH_BASE}/${input.platformPageId}/feed?access_token=${encodeURIComponent(credential.accessToken)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ message: input.text }).toString(),
          },
        );

        raw = await resp.json().catch(() => null);

        if (!resp.ok) {
          return { ok: false, error: await this.parseMetaError(resp, raw) };
        }

        const body = raw as MetaFacebookFeedPublishResponse;
        return {
          ok: true,
          value: {
            externalPostId: body.id,
            externalUrl: `https://www.facebook.com/${body.id.replace("_", "/posts/")}`,
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

    // Instagram requires media
    if (input.media.length === 0) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message:
            "Instagram requires at least one image or video. Caption-only posts are not supported by the Graph API.",
        },
      };
    }

    // TODO(media): Implement once R2 signed-URL flow lands.
    //   Step 1: POST ${GRAPH_BASE}/${platformUserId}/media
    //             ?image_url=${publicR2Url}&caption=${input.text}&access_token=...
    //           → { id: creation_id }
    //   Step 2: POST ${GRAPH_BASE}/${platformUserId}/media_publish
    //             ?creation_id=${creation_id}&access_token=...
    //           → { id: media_id }
    return {
      ok: false,
      error: {
        kind: "validation_failed",
        message: "Instagram publish lands after R2 media upload (Phase D).",
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Not in scope for Phase F1
  // ────────────────────────────────────────────────────────────────────────────

  async fetchAnalytics(
    _credential: AdapterCredential,
    _input: FetchAnalyticsInput,
  ): Promise<AdapterResult<AnalyticsSnapshot>> {
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: `fetchAnalytics not implemented for ${this.platform} (Phase G)`,
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
        message: `fetchInbox not implemented for ${this.platform} (Phase H)`,
      },
    };
  }

  async reply(
    _credential: AdapterCredential,
    _input: ReplyInput,
  ): Promise<AdapterResult<ReplyOutput>> {
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: `reply not implemented for ${this.platform} (Phase H)`,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────────────────────────────────

  private async exchangeForFacebook(
    pages: MetaPagesListResponse["data"],
    expiresAt: string,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    const page = pages.find((p) => p.tasks.includes("CREATE_CONTENT"));

    if (!page) {
      // TODO(v2): page-selection UI
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message:
            "No Facebook Page with CREATE_CONTENT permission found. Ensure you have a Page and the correct permissions.",
        },
      };
    }

    const pageToken = page.access_token;
    const detailResult = await this.getJson<MetaFacebookPageDetailResponse>(
      `${GRAPH_BASE}/${page.id}?${new URLSearchParams({
        fields: "id,name,fan_count,picture",
        access_token: pageToken,
      }).toString()}`,
    );
    if (!detailResult.ok) return detailResult;

    const detail = detailResult.value;
    const scopes = FACEBOOK_SCOPES.split(",");

    return {
      ok: true,
      value: {
        credential: {
          accessToken: pageToken,
          refreshToken: null,
          expiresAt,
          externalAccountId: page.id,
          scopes,
        },
        profile: {
          platformUserId: page.id,
          platformUsername: page.name,
          platformPageId: page.id,
          displayName: detail.name,
          avatarUrl: detail.picture?.data?.url ?? undefined,
          profileUrl: `https://www.facebook.com/${page.id}`,
        },
      },
    };
  }

  private async exchangeForInstagram(
    pages: MetaPagesListResponse["data"],
    expiresAt: string,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    // For each Page, check for a linked IG Business Account
    for (const page of pages) {
      const igCheckResult = await this.getJson<MetaPageWithInstagramResponse>(
        `${GRAPH_BASE}/${page.id}?${new URLSearchParams({
          fields: "instagram_business_account",
          access_token: page.access_token,
        }).toString()}`,
      );

      if (!igCheckResult.ok) continue;

      const igId = igCheckResult.value.instagram_business_account?.id;
      if (!igId) continue;

      // Found a Page with a linked IG Business Account — fetch IG details
      const igDetailResult = await this.getJson<MetaInstagramAccountResponse>(
        `${GRAPH_BASE}/${igId}?${new URLSearchParams({
          fields: "id,username,name,profile_picture_url,followers_count",
          access_token: page.access_token,
        }).toString()}`,
      );
      if (!igDetailResult.ok) return igDetailResult;

      const ig = igDetailResult.value;
      const scopes = INSTAGRAM_SCOPES.split(",");

      // TODO(v2): page-selection UI
      return {
        ok: true,
        value: {
          credential: {
            accessToken: page.access_token,
            refreshToken: null,
            expiresAt,
            externalAccountId: ig.id,
            scopes,
          },
          profile: {
            platformUserId: ig.id,
            platformUsername: ig.username,
            platformPageId: page.id,
            displayName: ig.name ?? ig.username,
            avatarUrl: ig.profile_picture_url ?? undefined,
            profileUrl: `https://www.instagram.com/${ig.username}`,
          },
        },
      };
    }

    return {
      ok: false,
      error: {
        kind: "validation_failed",
        message:
          "No Instagram Business account is linked to any of your Facebook Pages. " +
          "Link one via Meta Business Suite, then reconnect.",
      },
    };
  }

  private async getJson<T>(url: string): Promise<AdapterResult<T>> {
    let raw: unknown;
    try {
      const resp = await fetch(url);
      raw = await resp.json().catch(() => null);

      if (!resp.ok) {
        return { ok: false, error: await this.parseMetaError(resp, raw) };
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

  private async parseMetaError(resp: Response, raw: unknown): Promise<AdapterError> {
    if (resp.status === 401 || resp.status === 403) {
      return { kind: "auth_expired", message: "Meta token rejected", raw };
    }
    if (resp.status === 429) {
      const retryAfter = resp.headers.get("retry-after");
      return {
        kind: "rate_limited",
        message: "Meta API rate limit exceeded",
        raw,
        retryAfterSeconds: retryAfter ? Number(retryAfter) : 60,
      };
    }
    const err = raw as MetaErrorResponse | null;
    return {
      kind: "platform_error",
      message: err?.error?.message ?? `Meta returned HTTP ${resp.status}`,
      raw,
    };
  }
}
