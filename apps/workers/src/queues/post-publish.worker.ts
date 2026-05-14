import { PrismaClient } from "@prisma/client";
import type { PostPublishJob } from "@pulse/types/event-types";
import { type Job, Worker } from "bullmq";

import { decrypt } from "../encryption";
import { redis } from "../redis";

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────────────────────
// Minimal Twitter publish — inline for Phase C.
// Tech debt: extract to packages/platform-adapters in Phase F when other
// platforms land, so all adapters are shared between apps/api and apps/workers.
// ────────────────────────────────────────────────────────────────────────────

type TwitterPublishResult =
  | { ok: true; platformPostId: string; platformPostUrl: string }
  | {
      ok: false;
      kind: "auth_expired" | "rate_limited" | "platform_error" | "network_error";
      message: string;
      retryAfterSeconds?: number;
    };

async function publishTweet(accessToken: string, text: string): Promise<TwitterPublishResult> {
  let raw: unknown;
  try {
    const resp = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    raw = await resp.json().catch(() => null);

    if (resp.status === 401) {
      return { ok: false, kind: "auth_expired", message: "Twitter token expired or revoked" };
    }

    if (resp.status === 429) {
      const retryAfter = resp.headers.get("retry-after");
      return {
        ok: false,
        kind: "rate_limited",
        message: "Twitter API rate limit exceeded",
        retryAfterSeconds: retryAfter ? Number(retryAfter) : 60,
      };
    }

    if (!resp.ok) {
      const err = raw as { detail?: string; title?: string } | null;
      return {
        ok: false,
        kind: "platform_error",
        message: err?.detail ?? err?.title ?? `Twitter returned HTTP ${resp.status}`,
      };
    }

    const body = raw as { data: { id: string } };
    return {
      ok: true,
      platformPostId: body.data.id,
      platformPostUrl: `https://x.com/i/web/status/${body.data.id}`,
    };
  } catch (err) {
    return {
      ok: false,
      kind: "network_error",
      message: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Worker
// ────────────────────────────────────────────────────────────────────────────

export const postPublishWorker = new Worker<PostPublishJob>(
  "post-publish",
  async (job: Job<PostPublishJob>) => {
    const { brandId, postId, publicationId, platform, idempotencyKey } = job.data;
    const startMs = Date.now();

    console.log(`[post-publish] processing ${job.id}`, {
      brandId,
      publicationId,
      platform,
      idempotencyKey,
    });

    // Step 1 — Load publication with post content and connected account
    const publication = await prisma.postPublication.findUnique({
      where: { id: publicationId },
      include: {
        post: { select: { content: true, brandId: true } },
        connectedAccount: true,
      },
    });

    if (!publication) {
      console.error(`[post-publish] publication ${publicationId} not found — skipping`);
      return { ok: false, skipped: true, reason: "publication_not_found" };
    }

    // Step 2 — Idempotency: skip if already published
    if (publication.platformPostId && publication.status === "PUBLISHED") {
      console.log(`[post-publish] ${idempotencyKey} already published — skipping`);
      return { ok: true, skipped: true };
    }

    const { connectedAccount, post } = publication;

    // Step 3 — Validate connected account is active
    if (connectedAccount.status !== "ACTIVE") {
      await prisma.postPublication.update({
        where: { id: publicationId },
        data: {
          status: "FAILED",
          errorMessage: `Connected account status is ${connectedAccount.status}`,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      await writeJobLog({
        jobId: job.id ?? "unknown",
        brandId,
        postId,
        publicationId,
        platform,
        status: "FAILED",
        durationMs: Date.now() - startMs,
        errorMessage: `Connected account status is ${connectedAccount.status}`,
      });
      return { ok: false, reason: "account_not_active" };
    }

    // Step 4 — Decrypt tokens
    let accessToken: string;
    try {
      accessToken = decrypt(connectedAccount.accessToken);
    } catch {
      await prisma.postPublication.update({
        where: { id: publicationId },
        data: {
          status: "FAILED",
          errorMessage: "Failed to decrypt access token",
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      await writeJobLog({
        jobId: job.id ?? "unknown",
        brandId,
        postId,
        publicationId,
        platform,
        status: "FAILED",
        durationMs: Date.now() - startMs,
        errorMessage: "Failed to decrypt access token",
      });
      return { ok: false, reason: "decryption_failed" };
    }

    // Step 5 — Dispatch to the platform
    // For Phase C, only Twitter is supported. Phase F will route via a shared adapter registry.
    if (platform !== "twitter") {
      await prisma.postPublication.update({
        where: { id: publicationId },
        data: {
          status: "FAILED",
          errorMessage: `Platform ${platform} not yet supported by workers`,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      await writeJobLog({
        jobId: job.id ?? "unknown",
        brandId,
        postId,
        publicationId,
        platform,
        status: "FAILED",
        durationMs: Date.now() - startMs,
        errorMessage: `Platform ${platform} not yet supported by workers`,
      });
      return { ok: false, reason: "platform_not_supported" };
    }

    const result = await publishTweet(accessToken, post.content);
    const durationMs = Date.now() - startMs;

    // Step 6 — Handle success
    if (result.ok) {
      await prisma.postPublication.update({
        where: { id: publicationId },
        data: {
          status: "PUBLISHED",
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          publishedAt: new Date(),
          errorMessage: null,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      await writeJobLog({
        jobId: job.id ?? "unknown",
        brandId,
        postId,
        publicationId,
        platform,
        status: "COMPLETED",
        durationMs,
        result: { platformPostId: result.platformPostId },
      });
      console.log(`[post-publish] published ${idempotencyKey} → ${result.platformPostId}`);
      return { ok: true, platformPostId: result.platformPostId };
    }

    // Step 7 — Handle failures

    if (result.kind === "auth_expired") {
      // Mark account expired; do NOT retry — user must reconnect
      await Promise.all([
        prisma.connectedAccount.update({
          where: { id: connectedAccount.id },
          data: { status: "EXPIRED", lastErrorAt: new Date(), lastErrorMessage: result.message },
        }),
        prisma.postPublication.update({
          where: { id: publicationId },
          data: {
            status: "FAILED",
            errorMessage: result.message,
            lastAttemptAt: new Date(),
            attemptCount: { increment: 1 },
          },
        }),
      ]);
      await writeJobLog({
        jobId: job.id ?? "unknown",
        brandId,
        postId,
        publicationId,
        platform,
        status: "FAILED",
        durationMs,
        errorMessage: result.message,
      });
      console.warn(`[post-publish] auth expired for account=${connectedAccount.id}`);
      return { ok: false, reason: "auth_expired" };
    }

    if (result.kind === "rate_limited") {
      // Throw so BullMQ retries with backoff
      console.warn(`[post-publish] rate limited — will retry`);
      throw new Error(`Twitter rate limited: ${result.message}`);
    }

    // Other permanent failures
    await prisma.postPublication.update({
      where: { id: publicationId },
      data: {
        status: "FAILED",
        errorMessage: result.message,
        lastAttemptAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    await writeJobLog({
      jobId: job.id ?? "unknown",
      brandId,
      postId,
      publicationId,
      platform,
      status: "FAILED",
      durationMs,
      errorMessage: result.message,
    });
    console.error(`[post-publish] permanent failure for ${idempotencyKey}: ${result.message}`);
    return { ok: false, reason: result.kind };
  },
  { connection: redis },
);

postPublishWorker.on("completed", (job) => {
  console.log(`[post-publish] completed ${job.id}`);
});

postPublishWorker.on("failed", (job, err) => {
  console.error(`[post-publish] failed ${job?.id}`, err.message);
});

// ────────────────────────────────────────────────────────────────────────────
// JobLog helper
// ────────────────────────────────────────────────────────────────────────────

async function writeJobLog(params: {
  jobId: string;
  brandId: string;
  postId: string;
  publicationId: string;
  platform: string;
  status: "COMPLETED" | "FAILED";
  durationMs: number;
  errorMessage?: string;
  result?: Record<string, string>;
}) {
  try {
    await prisma.jobLog.create({
      data: {
        type: "POST_PUBLISH",
        status: params.status,
        brandId: params.brandId,
        postId: params.postId,
        payload: { publicationId: params.publicationId, platform: params.platform },
        result: params.result,
        errorMessage: params.errorMessage ?? null,
        bullJobId: params.jobId,
        startedAt: new Date(Date.now() - params.durationMs),
        completedAt: new Date(),
        durationMs: params.durationMs,
        scheduledFor: new Date(),
        attemptCount: 1,
      },
    });
  } catch (err) {
    // JobLog writes are best-effort — never let them crash the worker
    console.error("[post-publish] failed to write JobLog", err);
  }
}
