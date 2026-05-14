import { PrismaClient } from "@prisma/client";
import type { PostPublishJob } from "@pulse/types/event-types";
import { type Job, Worker } from "bullmq";
import { getAdapter } from "../../../api/src/platforms/adapter-registry";
import type {
  AdapterCredential,
  PublishInput,
} from "../../../api/src/platforms/base-platform-adapter";
import { decrypt } from "../encryption";
import { redis } from "../redis";

const prisma = new PrismaClient();

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
        post: {
          select: {
            content: true,
            brandId: true,
            media: {
              where: { type: { not: "DOCUMENT" } },
              orderBy: { position: "asc" },
            },
          },
        },
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

    // Step 5 — Dispatch to the platform via the adapter registry
    let refreshToken: string | null = null;
    try {
      if (connectedAccount.refreshToken) {
        refreshToken = decrypt(connectedAccount.refreshToken);
      }
    } catch {
      // refreshToken is optional — proceed without it
    }

    const credential: AdapterCredential = {
      accessToken,
      refreshToken,
      expiresAt: connectedAccount.tokenExpiresAt?.toISOString() ?? null,
      externalAccountId: connectedAccount.platformUserId,
      scopes: connectedAccount.scopes,
    };

    const publishInput: PublishInput = {
      idempotencyKey,
      text: post.content,
      media: post.media.map((m) => ({
        key: m.storageKey,
        kind: m.type === "VIDEO" ? "video" : "image",
        filename: m.fileName,
        url: m.url,
        mimeType: m.mimeType,
      })),
      platformUserId: connectedAccount.platformUserId,
      platformPageId: connectedAccount.platformPageId ?? undefined,
    };

    let adapter: ReturnType<typeof getAdapter>;
    try {
      adapter = getAdapter(platform);
    } catch {
      await prisma.postPublication.update({
        where: { id: publicationId },
        data: {
          status: "FAILED",
          errorMessage: `Platform ${platform} not supported`,
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
        errorMessage: `Platform ${platform} not supported`,
      });
      return { ok: false, reason: "platform_not_supported" };
    }

    const result = await adapter.publish(credential, publishInput);
    const durationMs = Date.now() - startMs;

    if (!result.ok) {
      console.error(`[post-publish] platform error for ${idempotencyKey}`, {
        kind: result.error.kind,
        message: result.error.message,
        raw: JSON.stringify(result.error.raw ?? null),
      });
    }

    // Step 6 — Handle success
    if (result.ok) {
      await prisma.postPublication.update({
        where: { id: publicationId },
        data: {
          status: "PUBLISHED",
          platformPostId: result.value.externalPostId,
          platformPostUrl: result.value.externalUrl,
          publishedAt: new Date(),
          errorMessage: null,
          lastAttemptAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      const mediaCount = publishInput.media.length;
      await writeJobLog({
        jobId: job.id ?? "unknown",
        brandId,
        postId,
        publicationId,
        platform,
        status: "COMPLETED",
        durationMs,
        result: {
          platformPostId: result.value.externalPostId,
          hasMedia: String(mediaCount > 0),
          mediaCount: String(mediaCount),
        },
      });
      console.log(`[post-publish] published ${idempotencyKey} → ${result.value.externalPostId}`);
      return {
        ok: true,
        platformPostId: result.value.externalPostId,
        hasMedia: mediaCount > 0,
        mediaCount,
      };
    }

    // Step 7 — Handle failures

    if (result.error.kind === "auth_expired") {
      // Mark account expired; do NOT retry — user must reconnect
      await Promise.all([
        prisma.connectedAccount.update({
          where: { id: connectedAccount.id },
          data: {
            status: "EXPIRED",
            lastErrorAt: new Date(),
            lastErrorMessage: result.error.message,
          },
        }),
        prisma.postPublication.update({
          where: { id: publicationId },
          data: {
            status: "FAILED",
            errorMessage: result.error.message,
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
        errorMessage: result.error.message,
      });
      console.warn(`[post-publish] auth expired for account=${connectedAccount.id}`);
      return { ok: false, reason: "auth_expired" };
    }

    if (result.error.kind === "rate_limited") {
      // Throw so BullMQ retries with backoff
      console.warn(`[post-publish] rate limited — will retry`);
      throw new Error(`${platform} rate limited: ${result.error.message}`);
    }

    // Other permanent failures
    await prisma.postPublication.update({
      where: { id: publicationId },
      data: {
        status: "FAILED",
        errorMessage: result.error.message,
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
      errorMessage: result.error.message,
    });
    console.error(
      `[post-publish] permanent failure for ${idempotencyKey}: ${result.error.message}`,
    );
    return { ok: false, reason: result.error.kind };
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
