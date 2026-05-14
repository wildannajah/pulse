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

  // Case A — attaches media rows when mediaKeys are provided
  it("attaches media rows transactionally when mediaKeys are provided", async () => {
    const mockAccount = { id: "acct-1", platform: "TWITTER", status: "ACTIVE" };
    const mockPost = { id: "post-1", status: "DRAFT", brandId: "brand-1" };
    const mockPublication = { id: "pub-1" };
    const mockTxPostMediaUpdate = vi.fn().mockResolvedValue({});

    const mockTransaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        post: { create: vi.fn().mockResolvedValue(mockPost) },
        postPublication: { create: vi.fn().mockResolvedValue(mockPublication) },
        postMedia: { update: mockTxPostMediaUpdate },
      };
      return fn(tx);
    });

    const mediaRows = [
      { id: "m1", storageKey: "key-a", postId: null, brandId: "brand-1" },
      { id: "m2", storageKey: "key-b", postId: null, brandId: "brand-1" },
    ];

    const ctx = makeCtx({
      prisma: {
        connectedAccount: { findFirst: vi.fn().mockResolvedValue(mockAccount) },
        postMedia: { findMany: vi.fn().mockResolvedValue(mediaRows) },
        $transaction: mockTransaction,
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    await callCreate(ctx, {
      text: "Hello!",
      platforms: ["twitter"],
      mediaKeys: ["key-a", "key-b"],
    });

    expect(mockTxPostMediaUpdate).toHaveBeenCalledTimes(2);
    expect(mockTxPostMediaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { postId: "post-1", position: 0 } }),
    );
    expect(mockTxPostMediaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { postId: "post-1", position: 1 } }),
    );
  });

  // Case B — rejects when a key is not found
  it("throws BAD_REQUEST when a media key is not found", async () => {
    const mockTransaction = vi.fn();
    const mediaRows = [{ id: "m1", storageKey: "key-a", postId: null, brandId: "brand-1" }];

    const ctx = makeCtx({
      prisma: {
        postMedia: { findMany: vi.fn().mockResolvedValue(mediaRows) },
        $transaction: mockTransaction,
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    await expect(
      callCreate(ctx, {
        text: "Hello!",
        platforms: ["twitter"],
        mediaKeys: ["key-a", "key-missing"],
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("key-missing"),
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // Case C — rejects when media is already attached to another post
  it("throws CONFLICT when media is already attached to another post", async () => {
    const mockTransaction = vi.fn();
    const mediaRows = [
      { id: "m1", storageKey: "key-a", postId: "other-post-id", brandId: "brand-1" },
    ];

    const ctx = makeCtx({
      prisma: {
        postMedia: { findMany: vi.fn().mockResolvedValue(mediaRows) },
        $transaction: mockTransaction,
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    await expect(
      callCreate(ctx, { text: "Hello!", platforms: ["twitter"], mediaKeys: ["key-a"] }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  // Case D — rejects when exceeding Twitter's 4-image limit (validation runs before findMany)
  it("throws BAD_REQUEST when mediaKeys exceed the platform image limit", async () => {
    const mockPostMediaFindMany = vi.fn();

    const ctx = makeCtx({
      prisma: {
        postMedia: { findMany: mockPostMediaFindMany },
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    const err = await callCreate(ctx, {
      text: "Hello!",
      platforms: ["twitter"],
      mediaKeys: ["k1", "k2", "k3", "k4", "k5"],
    }).catch((e) => e);

    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toContain("Twitter");
    expect(err.message).toContain("4");
    expect(mockPostMediaFindMany).not.toHaveBeenCalled();
  });

  // Case E — accepts exactly maxImages media keys for a platform
  it("accepts exactly maxImages media keys without error", async () => {
    const mockAccount = { id: "acct-1", platform: "TWITTER", status: "ACTIVE" };
    const mockPost = { id: "post-1", status: "DRAFT", brandId: "brand-1" };
    const mockPublication = { id: "pub-1" };

    const mockTransaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        post: { create: vi.fn().mockResolvedValue(mockPost) },
        postPublication: { create: vi.fn().mockResolvedValue(mockPublication) },
        postMedia: { update: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const mediaRows = [
      { id: "m1", storageKey: "k1", postId: null, brandId: "brand-1" },
      { id: "m2", storageKey: "k2", postId: null, brandId: "brand-1" },
      { id: "m3", storageKey: "k3", postId: null, brandId: "brand-1" },
      { id: "m4", storageKey: "k4", postId: null, brandId: "brand-1" },
    ];

    const ctx = makeCtx({
      prisma: {
        connectedAccount: { findFirst: vi.fn().mockResolvedValue(mockAccount) },
        postMedia: { findMany: vi.fn().mockResolvedValue(mediaRows) },
        $transaction: mockTransaction,
      } as unknown as Partial<TrpcContext["prisma"]>,
    });

    const result = await callCreate(ctx, {
      text: "Hello!",
      platforms: ["twitter"],
      mediaKeys: ["k1", "k2", "k3", "k4"],
    });

    expect(result.id).toBe("post-1");
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
