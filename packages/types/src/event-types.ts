/**
 * Typed BullMQ job payloads for the four queues defined in CLAUDE.md.
 *
 * The producer side lives in apps/api (procedures enqueue jobs) and the
 * consumer side lives in apps/workers (workers process them). Sharing the
 * payload types here means a schema change is type-checked on both sides.
 *
 * Every payload carries `brandId` so observability tags (Sentry, JobLog) and
 * tenant-scoped error handling work out of the box. Idempotency keys are
 * required on every job — re-runs must not double-publish, double-fetch, etc.
 */

import type { Platform } from "./platform";

/**
 * `post-publish` — publish a single PostPublication via the platform adapter.
 *
 * One job per (post × platform). The post worker fetches the publication
 * row, dispatches via `getAdapter(platform).publish(...)`, writes back the
 * result, and emits a JobLog row.
 */
export type PostPublishJob = {
  brandId: string;
  postId: string;
  publicationId: string;
  platform: Platform;
  /** stable key — `post-publish:${publicationId}` */
  idempotencyKey: string;
};

/**
 * `token-refresh` — refresh OAuth tokens that expire within the next 24h.
 *
 * Runs on a BullMQ repeat job (hourly). Producer side: a scheduler procedure
 * enqueues one job per ConnectedAccount whose `expiresAt` is in the window.
 */
export type TokenRefreshJob = {
  brandId: string;
  connectedAccountId: string;
  platform: Platform;
  /** stable key — `token-refresh:${connectedAccountId}:${expiresAtIso}` */
  idempotencyKey: string;
};

/**
 * `analytics-sync` — daily fetch of platform metrics per ConnectedAccount.
 *
 * Pulls follower counts, post-level metrics, audience insights, etc. and
 * upserts AnalyticsSnapshot / PostMetric / AudienceInsight rows.
 */
export type AnalyticsSyncJob = {
  brandId: string;
  connectedAccountId: string;
  platform: Platform;
  /** ISO date string (YYYY-MM-DD) — the day this job is syncing */
  syncDate: string;
  /** stable key — `analytics-sync:${connectedAccountId}:${syncDate}` */
  idempotencyKey: string;
};

/**
 * `inbox-sync` — periodic pull of comments/DMs/mentions per ConnectedAccount.
 *
 * Cadence: every 5 minutes per account by default. Per-platform deduplication
 * via the platform's native message id.
 */
export type InboxSyncJob = {
  brandId: string;
  connectedAccountId: string;
  platform: Platform;
  /** stable key — `inbox-sync:${connectedAccountId}:${runStartIso}` */
  idempotencyKey: string;
};

/** Map of queue name → payload type. Use to type `Worker<...>` invocations. */
export type QueuePayloads = {
  "post-publish": PostPublishJob;
  "token-refresh": TokenRefreshJob;
  "analytics-sync": AnalyticsSyncJob;
  "inbox-sync": InboxSyncJob;
};

export type QueueName = keyof QueuePayloads;
