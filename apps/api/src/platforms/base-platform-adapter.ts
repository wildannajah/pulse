import type { Platform } from "@pulse/types/platform";

/**
 * Common shape for everything a platform can do for Pulse.
 *
 * Each of the 7 supported platforms implements this interface; the adapter
 * registry routes calls based on `Platform`. Procedures and workers never
 * import a concrete adapter — they always go through `getAdapter(platform)`.
 *
 * Design constraints:
 *   - Pure functions of the inputs. No DI, no Prisma access. The caller
 *     hydrates the inputs (decrypts the token, loads the post, etc.) and
 *     persists the outputs.
 *   - All I/O is wrapped: every method returns Promise<AdapterResult<T>>
 *     instead of throwing. This forces callers to handle platform-specific
 *     error shapes consistently.
 *   - Idempotency is the caller's responsibility. The post-publish worker
 *     dedupes by `idempotencyKey`; adapters can additionally pass platform-
 *     supported idempotency headers (e.g. Twitter's `X-Idempotency-Key`).
 */

export type AdapterError = {
  /** stable taxonomy for filtering/alerting; not the platform's raw error code */
  kind:
    | "auth_expired"
    | "auth_revoked"
    | "rate_limited"
    | "validation_failed"
    | "not_found"
    | "platform_error"
    | "network_error";
  /** human-readable summary; safe to surface in the UI */
  message: string;
  /** raw response payload from the platform — opaque, for logs/Sentry */
  raw?: unknown;
  /** when the user can retry (rate limits, refresh-after) */
  retryAfterSeconds?: number;
};

export type AdapterResult<T> = { ok: true; value: T } | { ok: false; error: AdapterError };

/**
 * Decrypted token bundle. Adapters never touch the encrypted form.
 * Caller (a tRPC procedure or worker) passes plaintext after decrypting via
 * EncryptionService.
 */
export type AdapterCredential = {
  accessToken: string;
  refreshToken: string | null;
  /** ISO timestamp; null when the platform doesn't expire (rare) */
  expiresAt: string | null;
  /** Platform user / page id this credential authorises */
  externalAccountId: string;
  /** Optional scope list — adapters can use to fail fast on missing scopes */
  scopes?: readonly string[];
};

// ────────────────────────────────────────────────────────────────────────────
// publish
// ────────────────────────────────────────────────────────────────────────────

export type PublishMediaInput = {
  /** R2 object key — primarily for logging / debugging */
  key: string;
  /** "image" | "video" — adapters branch on this */
  kind: "image" | "video";
  /** Original filename — used as multipart filename when uploading to platforms */
  filename?: string;
  /**
   * Publicly accessible URL the adapter downloads from before re-uploading
   * to the target platform. Today this is the R2 CDN URL (PostMedia.url).
   * Adapter must NOT pass this URL directly to platforms — Twitter/Meta/etc
   * require binary upload, not URL reference (except IG's container endpoint).
   */
  url: string;
  /** MIME type of the asset — needed for multipart Content-Type headers */
  mimeType: string;
};

export type PublishInput = {
  /** Caller-issued idempotency key, e.g. `post-publish:${publicationId}` */
  idempotencyKey: string;
  /** Platform-specific text body (variants already resolved upstream) */
  text: string;
  media: PublishMediaInput[];
  /** Optional first-comment hashtag block (IG/FB Phase 3 feature) */
  firstComment?: string;
  /**
   * Platform user ID — required by Meta adapters.
   * - Facebook: FB Page ID
   * - Instagram: IG Business Account ID
   * Ignored by adapters that don't need it (Twitter, etc.).
   */
  platformUserId?: string;
  /**
   * FB Page ID — required by Instagram publishes (which post on behalf of
   * the linked Page) and Facebook publishes. Same as platformUserId for FB.
   */
  platformPageId?: string;
};

export type PublishOutput = {
  /** Platform-native post id, used to fetch metrics later */
  externalPostId: string;
  /** Public URL to the published post — surface in UI for verification */
  externalUrl: string | null;
  /** Optional follow-up: when to first try fetching analytics */
  metricsAvailableAfterSeconds?: number;
};

// ────────────────────────────────────────────────────────────────────────────
// analytics
// ────────────────────────────────────────────────────────────────────────────

export type FetchAnalyticsInput = {
  /** ISO date string (YYYY-MM-DD) — the day we want a snapshot for */
  syncDate: string;
};

export type AnalyticsSnapshot = {
  followers: number;
  impressions: number | null;
  reach: number | null;
  engagementRate: number | null;
  /** Per-published-post metrics keyed by externalPostId */
  postMetrics: Record<
    string,
    {
      likes: number;
      comments: number;
      shares: number | null;
      reach: number | null;
      impressions: number | null;
    }
  >;
};

// ────────────────────────────────────────────────────────────────────────────
// inbox
// ────────────────────────────────────────────────────────────────────────────

export type InboxItemKind = "comment" | "dm" | "mention";

export type InboxItem = {
  /** Platform-native message id; caller dedupes by this */
  externalId: string;
  kind: InboxItemKind;
  authorHandle: string;
  authorDisplayName: string | null;
  authorExternalId: string;
  body: string;
  createdAt: string;
  /** When the kind is `comment`, the post it's on */
  parentPostExternalId?: string;
};

export type ReplyInput = {
  /** What we're replying to (the externalId surfaced by `fetchInbox`) */
  inReplyTo: string;
  /** Inbox item kind — some platforms route DMs vs comments differently */
  kind: InboxItemKind;
  text: string;
  idempotencyKey: string;
};

export type ReplyOutput = {
  externalReplyId: string;
};

// ────────────────────────────────────────────────────────────────────────────
// profile
// ────────────────────────────────────────────────────────────────────────────

export type ProfileSnapshot = {
  /** Display name / page name */
  displayName: string;
  /** @handle / username — null when the platform uses display name only */
  handle: string | null;
  avatarUrl: string | null;
  followerCount: number;
};

// ────────────────────────────────────────────────────────────────────────────
// adapter contract
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// OAuth lifecycle
// ────────────────────────────────────────────────────────────────────────────

export type BuildAuthorizationUrlInput = {
  /** Opaque CSRF / intent-binding token generated by OAuthStateService. */
  state: string;
  /** Absolute callback URL — must match what was registered with the platform. */
  redirectUri: string;
  /**
   * PKCE code verifier — adapter hashes to code_challenge.
   * Pass for PKCE platforms; ignored by adapters that don't use PKCE.
   */
  codeVerifier?: string;
  /** OAuth 1.0a request token obtained from fetchRequestToken. Only used by Twitter. */
  oauth1RequestToken?: string;
};

export type ExchangeAuthCodeInput = {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
};

export type ExchangeAuthCodeOutput = {
  credential: AdapterCredential;
  profile: {
    platformUserId: string;
    platformUsername: string;
    platformPageId?: string;
    displayName?: string;
    avatarUrl?: string;
    profileUrl?: string;
  };
};

export interface BasePlatformAdapter {
  readonly platform: Platform;

  /**
   * Build the platform's OAuth authorization URL.
   * Pulse-level credentials (client_id, scopes) come from env on the adapter
   * side. Caller passes the opaque state token and the absolute redirect_uri.
   * Synchronous — no network call needed to construct the URL.
   */
  buildAuthorizationUrl(input: BuildAuthorizationUrlInput): AdapterResult<{ url: string }>;

  /**
   * Exchange the platform's authorization `code` for tokens + profile.
   * Called by the OAuth callback handler for OAuth 2.0 platforms. Returns
   * plaintext credentials + the bare profile fields needed to populate
   * `ConnectedAccount`. The caller encrypts and persists.
   */
  exchangeAuthCode(input: ExchangeAuthCodeInput): Promise<AdapterResult<ExchangeAuthCodeOutput>>;

  /**
   * OAuth 1.0a only — fetch a request token before redirecting the user.
   * Returns the request token and secret; the caller stores the secret in
   * Redis keyed by the request token for the callback to retrieve.
   */
  fetchRequestToken?(
    callbackUrl: string,
  ): Promise<AdapterResult<{ requestToken: string; requestTokenSecret: string }>>;

  /**
   * OAuth 1.0a only — exchange the verifier for a permanent access token.
   * Called by the OAuth callback handler when `oauth_token` + `oauth_verifier`
   * are present. The caller retrieves the stored requestTokenSecret from Redis.
   */
  exchangeOAuth1Verifier?(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string,
  ): Promise<AdapterResult<ExchangeAuthCodeOutput>>;

  /** Publish a post; the worker calls this and persists the output. */
  publish(
    credential: AdapterCredential,
    input: PublishInput,
  ): Promise<AdapterResult<PublishOutput>>;

  /**
   * Refresh an OAuth token. Returns a new credential bundle the caller
   * encrypts + writes back to ConnectedAccount.
   */
  refreshToken(credential: AdapterCredential): Promise<AdapterResult<AdapterCredential>>;

  /** Revoke / disconnect on the platform side. Best-effort. */
  revokeToken(credential: AdapterCredential): Promise<AdapterResult<void>>;

  /** Fetch the current profile snapshot — followers, avatar, handle. */
  fetchProfile(credential: AdapterCredential): Promise<AdapterResult<ProfileSnapshot>>;

  /** Daily metrics + per-post stats for the given date. */
  fetchAnalytics(
    credential: AdapterCredential,
    input: FetchAnalyticsInput,
  ): Promise<AdapterResult<AnalyticsSnapshot>>;

  /**
   * New comments / DMs / mentions since the last sync.
   * Caller passes the most recent `externalId` it has seen so the adapter
   * can paginate appropriately. Pass `null` for the initial sync.
   */
  fetchInbox(
    credential: AdapterCredential,
    sinceExternalId: string | null,
  ): Promise<AdapterResult<InboxItem[]>>;

  /** Reply to a single inbox item. */
  reply(credential: AdapterCredential, input: ReplyInput): Promise<AdapterResult<ReplyOutput>>;
}
