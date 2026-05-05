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
  /** R2 object key — adapter fetches via signed read URL */
  key: string;
  /** "image" | "video" — adapters branch on this */
  kind: "image" | "video";
  /** Original filename for content-type / extension hints */
  filename?: string;
};

export type PublishInput = {
  /** Caller-issued idempotency key, e.g. `post-publish:${publicationId}` */
  idempotencyKey: string;
  /** Platform-specific text body (variants already resolved upstream) */
  text: string;
  media: PublishMediaInput[];
  /** Optional first-comment hashtag block (IG/FB Phase 3 feature) */
  firstComment?: string;
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

export interface BasePlatformAdapter {
  readonly platform: Platform;

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
