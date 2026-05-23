import { createHmac, randomBytes } from "node:crypto";

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
  PublishMediaInput,
  PublishOutput,
  ReplyInput,
  ReplyOutput,
} from "../base-platform-adapter";
import type {
  TwitterErrorResponse,
  TwitterMediaUploadResponse,
  TwitterTweetResponse,
  TwitterUserResponse,
} from "./twitter-api-types";

const REQUEST_TOKEN_URL = "https://api.twitter.com/oauth/request_token";
const AUTHORIZE_URL = "https://api.twitter.com/oauth/authorize";
const ACCESS_TOKEN_URL = "https://api.twitter.com/oauth/access_token";
const REVOKE_URL = "https://api.twitter.com/1.1/oauth/invalidate_token.json";
const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
const TWEETS_URL = "https://api.x.com/2/tweets";
const USER_ME_URL = "https://api.x.com/2/users/me?user.fields=profile_image_url,url,name,username";

// Scopes granted at the app level — OAuth 1.0a doesn't use per-token scopes
const OAUTH1_SCOPES = ["read", "write", "dm"] as const;

type TwitterAdapterConfig = {
  consumerKey: string;
  consumerSecret: string;
};

export class TwitterAdapter implements BasePlatformAdapter {
  readonly platform: Platform = "twitter";

  private readonly consumerKey: string;
  private readonly consumerSecret: string;

  constructor(config: TwitterAdapterConfig) {
    if (!config.consumerKey) throw new Error("TwitterAdapter: TWITTER_CONSUMER_KEY is required");
    if (!config.consumerSecret)
      throw new Error("TwitterAdapter: TWITTER_CONSUMER_SECRET is required");
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // OAuth 1.0a lifecycle
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Build the Twitter OAuth 1.0a authorization URL.
   * Requires a request token obtained via fetchRequestToken first.
   */
  buildAuthorizationUrl(input: BuildAuthorizationUrlInput): AdapterResult<{ url: string }> {
    const { oauth1RequestToken } = input;

    if (!oauth1RequestToken) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message: "Twitter OAuth 1.0a requires a request token — call fetchRequestToken first",
        },
      };
    }

    return {
      ok: true,
      value: { url: `${AUTHORIZE_URL}?oauth_token=${oauth1RequestToken}` },
    };
  }

  /**
   * Fetch a temporary request token from Twitter.
   * Step 1 of the OAuth 1.0a three-legged flow.
   */
  async fetchRequestToken(
    callbackUrl: string,
  ): Promise<AdapterResult<{ requestToken: string; requestTokenSecret: string }>> {
    const authHeader = this.signRequest({
      method: "POST",
      url: REQUEST_TOKEN_URL,
      oauthCallback: callbackUrl,
    });

    let raw: string;
    try {
      const resp = await fetch(REQUEST_TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      raw = await resp.text().catch(() => "");

      if (resp.status === 401) {
        return {
          ok: false,
          error: {
            kind: "auth_expired",
            message: "Twitter rejected request token fetch — check consumer credentials",
            raw,
          },
        };
      }

      if (!resp.ok) {
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: `Twitter request token returned HTTP ${resp.status}`,
            raw,
          },
        };
      }

      const params = new URLSearchParams(raw);
      const oauthToken = params.get("oauth_token");
      const oauthTokenSecret = params.get("oauth_token_secret");

      if (!oauthToken || !oauthTokenSecret) {
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: "Twitter request token response missing oauth_token or oauth_token_secret",
            raw,
          },
        };
      }

      return {
        ok: true,
        value: { requestToken: oauthToken, requestTokenSecret: oauthTokenSecret },
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

  /**
   * Exchange the OAuth 1.0a verifier for a permanent access token.
   * Step 3 of the three-legged flow (step 2 is the user redirect).
   */
  async exchangeOAuth1Verifier(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    const authHeader = this.signRequest({
      method: "POST",
      url: ACCESS_TOKEN_URL,
      oauthToken: requestToken,
      oauthVerifier: verifier,
      tokenSecret: requestTokenSecret,
    });

    let raw: string;
    try {
      const resp = await fetch(ACCESS_TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      raw = await resp.text().catch(() => "");

      if (resp.status === 401) {
        return {
          ok: false,
          error: {
            kind: "auth_expired",
            message:
              "Twitter rejected access token exchange — invalid verifier or expired request token",
            raw,
          },
        };
      }

      if (!resp.ok) {
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: `Twitter access token exchange returned HTTP ${resp.status}`,
            raw,
          },
        };
      }

      const params = new URLSearchParams(raw);
      const accessToken = params.get("oauth_token");
      const accessTokenSecret = params.get("oauth_token_secret");
      const userId = params.get("user_id");
      const screenName = params.get("screen_name");

      if (!accessToken || !accessTokenSecret || !userId || !screenName) {
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: "Twitter access token response missing required fields",
            raw,
          },
        };
      }

      const profileResult = await this.getUser(accessToken, accessTokenSecret);
      if (!profileResult.ok) return profileResult;

      const user = profileResult.value;

      return {
        ok: true,
        value: {
          credential: {
            accessToken,
            refreshToken: accessTokenSecret, // stored as refreshToken; no real refresh for OAuth 1.0a
            expiresAt: null, // OAuth 1.0a tokens are permanent
            externalAccountId: userId,
            scopes: [...OAUTH1_SCOPES],
          },
          profile: {
            platformUserId: userId,
            platformUsername: screenName,
            displayName: user.name,
            avatarUrl: user.profile_image_url,
            profileUrl: `https://x.com/${screenName}`,
            platformPageId: undefined,
          },
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

  /**
   * Not used for Twitter OAuth 1.0a — exchangeOAuth1Verifier handles the flow.
   */
  async exchangeAuthCode(
    _input: ExchangeAuthCodeInput,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>> {
    return {
      ok: false,
      error: {
        kind: "platform_error",
        message: "Twitter uses OAuth 1.0a — use exchangeOAuth1Verifier instead",
      },
    };
  }

  /** OAuth 1.0a tokens are permanent — return the credential unchanged. */
  async refreshToken(credential: AdapterCredential): Promise<AdapterResult<AdapterCredential>> {
    return { ok: true, value: credential };
  }

  async revokeToken(credential: AdapterCredential): Promise<AdapterResult<void>> {
    const formParams = { access_token: credential.accessToken };
    const authHeader = this.signRequest({
      method: "POST",
      url: REVOKE_URL,
      formParams,
      oauthToken: credential.accessToken,
      tokenSecret: credential.refreshToken ?? "",
    });

    let raw: unknown;
    try {
      const resp = await fetch(REVOKE_URL, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(formParams).toString(),
      });

      raw = await resp.json().catch(() => null);

      // Best-effort revocation: Twitter's v1.1 invalidate_token.json is unreliable
      // (deprecated behavior, OAuth 1.0a phase-out, app-permission mismatches all
      // surface as 400/401/403). The caller deletes the local row regardless, so
      // we collapse these client-error statuses into success and only surface
      // network errors or 5xx responses.
      if (resp.status === 401 || resp.status === 400 || resp.status === 403) {
        return { ok: true, value: undefined };
      }

      if (!resp.ok) {
        const err = raw as TwitterErrorResponse | null;
        const v11Message = err?.errors?.[0]?.message;
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message:
              err?.detail ??
              err?.title ??
              v11Message ??
              `Twitter token revocation returned HTTP ${resp.status}`,
            raw,
          },
        };
      }

      return { ok: true, value: undefined };
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

  async fetchProfile(credential: AdapterCredential): Promise<AdapterResult<ProfileSnapshot>> {
    const userResult = await this.getUser(credential.accessToken, credential.refreshToken ?? "");
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
    if (input.media.length > 4) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message: "Twitter allows at most 4 media items per tweet",
        },
      };
    }

    // Upload each media item in sequence (Twitter rate-limits parallel uploads heavily)
    const mediaIds: string[] = [];
    for (const m of input.media) {
      const uploadResult = await this.uploadMedia(credential, m);
      if (!uploadResult.ok) {
        return uploadResult;
      }
      mediaIds.push(uploadResult.value);
    }

    const tweetBody: { text: string; media?: { media_ids: string[] } } = { text: input.text };
    if (mediaIds.length > 0) {
      tweetBody.media = { media_ids: mediaIds };
    }

    const authHeader = this.signRequest({
      method: "POST",
      url: TWEETS_URL,
      oauthToken: credential.accessToken,
      tokenSecret: credential.refreshToken ?? "",
    });

    let raw: unknown;
    try {
      const resp = await fetch(TWEETS_URL, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tweetBody),
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

  /**
   * Uploads one media asset to X.com via the v1.1 simple-upload endpoint.
   * Returns the platform's media_id_string.
   *
   * Simple upload works for images ≤ 5MB (JPEG, PNG, WEBP, GIF non-animated).
   * Video and oversized assets return validation_failed — chunked upload is a follow-up.
   */
  private async uploadMedia(
    credential: AdapterCredential,
    media: PublishMediaInput,
  ): Promise<AdapterResult<string>> {
    if (media.kind === "video") {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message: "Video uploads to Twitter require chunked upload — lands in a follow-up.",
        },
      };
    }

    let assetBytes: Blob;
    try {
      const downloadResp = await fetch(media.url);
      if (!downloadResp.ok) {
        return {
          ok: false,
          error: {
            kind: "platform_error",
            message: `Failed to download media from R2: HTTP ${downloadResp.status}`,
          },
        };
      }
      assetBytes = await downloadResp.blob();
    } catch (err) {
      return {
        ok: false,
        error: {
          kind: "network_error",
          message: err instanceof Error ? err.message : "Unknown network error downloading media",
          raw: err,
        },
      };
    }

    const MAX_SIMPLE_UPLOAD_BYTES = 5 * 1024 * 1024;
    if (assetBytes.size > MAX_SIMPLE_UPLOAD_BYTES) {
      return {
        ok: false,
        error: {
          kind: "validation_failed",
          message: `Image exceeds 5MB simple-upload limit (${assetBytes.size} bytes). Chunked upload lands in a follow-up.`,
        },
      };
    }

    const form = new FormData();
    form.append(
      "media",
      new Blob([assetBytes], { type: media.mimeType }),
      media.filename ?? "upload",
    );
    form.append("media_category", "tweet_image");

    // Multipart bodies are not included in the OAuth signature base string
    const authHeader = this.signRequest({
      method: "POST",
      url: MEDIA_UPLOAD_URL,
      oauthToken: credential.accessToken,
      tokenSecret: credential.refreshToken ?? "",
    });

    let raw: unknown;
    try {
      const resp = await fetch(MEDIA_UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: authHeader },
        body: form,
      });

      raw = await resp.json().catch(() => null);

      if (resp.status === 401) {
        return {
          ok: false,
          error: {
            kind: "auth_expired",
            message: "Twitter rejected media upload — token is expired or revoked",
            raw,
          },
        };
      }

      if (resp.status === 403) {
        return {
          ok: false,
          error: {
            kind: "validation_failed",
            message:
              "Twitter rejected media upload — reconnect your account to grant the media.write scope",
            raw,
          },
        };
      }

      if (resp.status === 429) {
        const retryAfter = resp.headers.get("retry-after");
        return {
          ok: false,
          error: {
            kind: "rate_limited",
            message: "Twitter media upload rate limited",
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
            message: err?.detail ?? err?.title ?? `Twitter media upload HTTP ${resp.status}`,
            raw,
          },
        };
      }

      const body = raw as TwitterMediaUploadResponse;
      return { ok: true, value: body.media_id_string };
    } catch (err) {
      return {
        ok: false,
        error: {
          kind: "network_error",
          message: err instanceof Error ? err.message : "Unknown network error during media upload",
          raw: err,
        },
      };
    }
  }

  private async getUser(
    accessToken: string,
    tokenSecret: string,
  ): Promise<
    AdapterResult<{ id: string; name: string; username: string; profile_image_url?: string }>
  > {
    const authHeader = this.signRequest({
      method: "GET",
      url: USER_ME_URL,
      oauthToken: accessToken,
      tokenSecret,
    });

    let raw: unknown;
    try {
      const resp = await fetch(USER_ME_URL, {
        headers: { Authorization: authHeader },
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

  /**
   * Build an OAuth 1.0a Authorization header for a request.
   *
   * - formParams: included in the signature base string (application/x-www-form-urlencoded body).
   *   Multipart bodies are NOT included per OAuth spec.
   * - Query params in `url` are automatically parsed and included in the signature.
   */
  private signRequest(opts: {
    method: "GET" | "POST";
    url: string;
    formParams?: Record<string, string>;
    oauthToken?: string;
    oauthVerifier?: string;
    oauthCallback?: string;
    tokenSecret?: string;
  }): string {
    const {
      method,
      url,
      formParams = {},
      oauthToken,
      oauthVerifier,
      oauthCallback,
      tokenSecret,
    } = opts;

    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

    // Collect query params to include in the signature base string
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const nonce = randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_version: "1.0",
    };

    if (oauthToken) oauthParams.oauth_token = oauthToken;
    if (oauthVerifier) oauthParams.oauth_verifier = oauthVerifier;
    if (oauthCallback) oauthParams.oauth_callback = oauthCallback;

    // Merge all param sources for signature calculation
    const allParams: Record<string, string> = { ...oauthParams, ...queryParams, ...formParams };

    // Sort by percent-encoded key, then percent-encoded value (per RFC 5849 §3.4.1.3.2)
    const sortedParams = Object.entries(allParams)
      .sort(([ak, av], [bk, bv]) => {
        const encAk = this.percentEncode(ak);
        const encBk = this.percentEncode(bk);
        if (encAk !== encBk) return encAk < encBk ? -1 : 1;
        return this.percentEncode(av) < this.percentEncode(bv) ? -1 : 1;
      })
      .map(([k, v]) => `${this.percentEncode(k)}=${this.percentEncode(v)}`)
      .join("&");

    const baseString = `${method}&${this.percentEncode(baseUrl)}&${this.percentEncode(sortedParams)}`;
    const signingKey = `${this.percentEncode(this.consumerSecret)}&${this.percentEncode(tokenSecret ?? "")}`;

    const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

    oauthParams.oauth_signature = signature;

    return (
      "OAuth " +
      Object.entries(oauthParams)
        .map(([k, v]) => `${k}="${this.percentEncode(v)}"`)
        .join(", ")
    );
  }

  /** RFC 5849 §3.6 percent encoding — encode all chars except ALPHA / DIGIT / "-" / "." / "_" / "~" */
  private percentEncode(str: string): string {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }
}
