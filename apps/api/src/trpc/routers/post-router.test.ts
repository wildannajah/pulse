import { describe, expect, it, vi } from "vitest";

import type { PostPublishQueueService } from "../../queues/post-publish-queue.service";
import type { TrpcContext } from "../trpc-context";
import { postRouter } from "./post-router";

// ─── helpers ────────────────────────────────────────────────────────────────

function makeQueue(overrides?: Partial<PostPublishQueueService>): PostPublishQueueService {
  return {
    enqueue: vi.fn().mockResolvedValue("job-id"),
    enqueueMany: vi.fn().mockResolvedValue(["job-id"]),
    onModuleDestroy: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as PostPublishQueueService;
}

function makeCtx(overrides?: {
  prisma?: Partial<TrpcContext["prisma"]>;
  queue?: Partial<PostPublishQueueService>;
}): TrpcContext {
  return {
    user: { id: "user-1" },
    brand: { id: "brand-1" },
    brandIdHeader: "brand-1",
    prisma: overrides?.prisma as unknown as TrpcContext["prisma"],
    r2: {} as TrpcContext["r2"],
    oauthState: {} as TrpcContext["oauthState"],
    config: {} as TrpcContext["config"],
    encryption: {} as TrpcContext["encryption"],
    postPublishQueue: makeQueue(overrides?.queue),
  } as unknown as TrpcContext;
}

// ─── helpers to invoke router procedures ───────────────────────────────────

type CreateInput = {
  text: string;
  platforms: (
    | "twitter"
    | "instagram"
    | "facebook"
    | "linkedin"
    | "threads"
    | "tiktok"
    | "youtube"
  )[];
  scheduledAt?: Date;
  mediaKeys?: string[];
};

async function callCreate(ctx: TrpcContext, input: CreateInput) {
  const caller = postRouter.createCaller(ctx);
  return caller.create(input);
}

async function callPublishNow(ctx: TrpcContext, input: { id: string }) {
  const caller = postRouter.createCaller(ctx);
  return caller.publishNow(input);
}

// ─── post.create ─────────────────────────────────────────────────────────────

describe("post.create", () => {
  it("creates Post + Publications and returns ids", async () => {
    const mockAccount = { id: "acct-1", platform: "TWITTER", status: "ACTIVE" };
    const mockPost = { id: "post-1", status: "DRAFT", brandId: "brand-1" };
    const mockPublication = { id: "pub-1" };

    const mockTransaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        post: { create: vi.fn().mockResolvedValue(mockPost) },
        postPublication: { create: vi.fn().mockResolvedValue(mockPublication) },
      };
      return fn(tx);
    });

    const ctx = makeCtx({
      prisma: {
        connectedAccount: {
          findFirst: vi.fn().mockResolvedValue(mockAccount),
        },
        $transaction: mockTransaction,
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    const result = await callCreate(ctx, { text: "Hello Twitter!", platforms: ["twitter"] });

    expect(result.id).toBe("post-1");
    expect(result.status).toBe("DRAFT");
    expect(result.publicationIds).toEqual(["pub-1"]);
  });

  it("throws BAD_REQUEST when no connected account exists for requested platform", async () => {
    const ctx = makeCtx({
      prisma: {
        connectedAccount: { findFirst: vi.fn().mockResolvedValue(null) },
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    await expect(callCreate(ctx, { text: "Hello!", platforms: ["twitter"] })).rejects.toMatchObject(
      { code: "BAD_REQUEST", message: expect.stringContaining("twitter") },
    );
  });

  it("throws BAD_REQUEST when Twitter content exceeds 280 chars", async () => {
    const ctx = makeCtx({
      prisma: {
        connectedAccount: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "acct-1", platform: "TWITTER", status: "ACTIVE" }),
        },
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    const longText = "a".repeat(281);
    await expect(callCreate(ctx, { text: longText, platforms: ["twitter"] })).rejects.toMatchObject(
      { code: "BAD_REQUEST", message: expect.stringContaining("280") },
    );
  });

  it("throws BAD_REQUEST when scheduledAt is in the past", async () => {
    const ctx = makeCtx({
      prisma: {
        connectedAccount: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "acct-1", platform: "TWITTER", status: "ACTIVE" }),
        },
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    const past = new Date(Date.now() - 60_000);
    await expect(
      callCreate(ctx, { text: "Hello!", platforms: ["twitter"], scheduledAt: past }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("future") });
  });
});

// ─── post.publishNow ─────────────────────────────────────────────────────────

describe("post.publishNow", () => {
  it("enqueues one job per publication and returns PUBLISHING status", async () => {
    const mockEnqueue = vi.fn().mockResolvedValue("job-id");
    const mockPost = {
      id: "post-1",
      brandId: "brand-1",
      status: "DRAFT",
      publications: [
        { id: "pub-1", connectedAccount: { platform: "TWITTER", status: "ACTIVE" } },
        { id: "pub-2", connectedAccount: { platform: "TWITTER", status: "ACTIVE" } },
      ],
    };

    const ctx = makeCtx({
      prisma: {
        post: { findFirst: vi.fn().mockResolvedValue(mockPost) },
        $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
          const tx = {
            post: { update: vi.fn().mockResolvedValue(undefined) },
            postPublication: { update: vi.fn().mockResolvedValue(undefined) },
          };
          return fn(tx);
        }),
      } as unknown as Partial<TrpcContext["prisma"]>,
      queue: { enqueue: mockEnqueue },
    });

    const result = await callPublishNow(ctx, { id: "post-1" });

    expect(result.status).toBe("PUBLISHING");
    expect(result.queuedJobIds).toHaveLength(2);
    expect(mockEnqueue).toHaveBeenCalledTimes(2);
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ publicationId: "pub-1", platform: "twitter" }),
    );
  });

  it("throws CONFLICT when post is already PUBLISHING", async () => {
    const mockPost = {
      id: "post-1",
      brandId: "brand-1",
      status: "PUBLISHING",
      publications: [],
    };

    const ctx = makeCtx({
      prisma: {
        post: { findFirst: vi.fn().mockResolvedValue(mockPost) },
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    await expect(callPublishNow(ctx, { id: "post-1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("PUBLISHING"),
    });
  });

  it("throws BAD_REQUEST when any connected account is expired", async () => {
    const mockPost = {
      id: "post-1",
      brandId: "brand-1",
      status: "DRAFT",
      publications: [{ id: "pub-1", connectedAccount: { platform: "TWITTER", status: "EXPIRED" } }],
    };

    const ctx = makeCtx({
      prisma: {
        post: { findFirst: vi.fn().mockResolvedValue(mockPost) },
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    await expect(callPublishNow(ctx, { id: "post-1" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("twitter"),
    });
  });
});
