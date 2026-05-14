import { PlatformEnum } from "@pulse/types/platform";
import { PLATFORM_CONSTRAINTS } from "@pulse/types/platform-constraints";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { brandProcedure, router } from "../trpc";

const PostStatusFilter = z.enum(["draft", "scheduled", "published", "failed"]).optional();

export const postRouter = router({
  /** Brand-scoped paginated post list with optional status filter. */
  list: brandProcedure
    .input(
      z
        .object({
          status: PostStatusFilter,
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          brandId: ctx.brand.id,
          deletedAt: null,
          ...(input.status ? { status: input.status.toUpperCase() as never } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const nextCursor = posts.length > input.limit ? posts.pop()?.id : null;
      return { posts, nextCursor };
    }),

  /** Single post detail. */
  get: brandProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findFirst({
      where: { id: input.id, brandId: ctx.brand.id, deletedAt: null },
      include: { variants: true, publications: true, media: true },
    });
    if (!post) throw new TRPCError({ code: "NOT_FOUND" });
    return post;
  }),

  /** Create a post (draft or scheduled) with per-platform publications. */
  create: brandProcedure
    .input(
      z.object({
        text: z.string().min(1).max(63206),
        platforms: z.array(PlatformEnum).min(1),
        scheduledAt: z.date().optional(),
        mediaKeys: z.array(z.string()).max(10).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.scheduledAt && input.scheduledAt <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "scheduledAt must be in the future" });
      }

      // Per-platform text validation
      for (const platform of input.platforms) {
        const constraint = PLATFORM_CONSTRAINTS[platform];
        if (input.text.length > constraint.charLimit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${constraint.name} content exceeds ${constraint.charLimit} characters`,
          });
        }
      }

      // Resolve and validate media keys (outside transaction — cheap read + early failure)
      let mediaRowsToAttach: { id: string; storageKey: string }[] = [];

      if (input.mediaKeys.length > 0) {
        // TODO(v2): differentiate image vs video count when we wire per-type media UI
        for (const platform of input.platforms) {
          const maxImages = PLATFORM_CONSTRAINTS[platform].media.maxImages;
          if (maxImages !== null && input.mediaKeys.length > maxImages) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${PLATFORM_CONSTRAINTS[platform].name} allows at most ${maxImages} media items per post`,
            });
          }
        }

        const found = await ctx.prisma.postMedia.findMany({
          where: {
            storageKey: { in: input.mediaKeys },
            brandId: ctx.brand.id,
          },
          select: { id: true, storageKey: true, postId: true },
        });

        // All keys must resolve to a row belonging to this brand
        const foundKeys = new Set(found.map((m) => m.storageKey));
        const missing = input.mediaKeys.filter((k) => !foundKeys.has(k));
        if (missing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Media keys not found or not owned by this brand: ${missing.join(", ")}`,
          });
        }

        // None of them should already be attached to a post
        const alreadyAttached = found.filter((m) => m.postId !== null);
        if (alreadyAttached.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Media already attached to another post: ${alreadyAttached
              .map((m) => m.storageKey)
              .join(", ")}`,
          });
        }

        mediaRowsToAttach = found.map((m) => ({ id: m.id, storageKey: m.storageKey }));
      }

      // Resolve connected accounts for all requested platforms
      const connectedAccounts = await Promise.all(
        input.platforms.map(async (platform) => {
          const account = await ctx.prisma.connectedAccount.findFirst({
            where: {
              brandId: ctx.brand.id,
              platform: platform.toUpperCase() as never,
              status: "ACTIVE",
              deletedAt: null,
            },
          });
          if (!account) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `No active ${platform} account connected to this brand`,
            });
          }
          return account;
        }),
      );

      const status = input.scheduledAt ? ("SCHEDULED" as const) : ("DRAFT" as const);

      const { post, publicationIds } = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            brandId: ctx.brand.id,
            authorId: ctx.user.id,
            content: input.text,
            status,
            scheduledAt: input.scheduledAt ?? null,
            timezone: "UTC",
          },
        });

        if (mediaRowsToAttach.length > 0) {
          await Promise.all(
            mediaRowsToAttach.map((row) =>
              tx.postMedia.update({
                where: { id: row.id },
                data: {
                  postId: created.id,
                  position: input.mediaKeys.indexOf(row.storageKey),
                },
              }),
            ),
          );
        }

        const publications = await Promise.all(
          connectedAccounts.map((account) =>
            tx.postPublication.create({
              data: {
                postId: created.id,
                connectedAccountId: account.id,
                platform: account.platform,
                status: "SCHEDULED",
              },
            }),
          ),
        );

        return { post: created, publicationIds: publications.map((p) => p.id) };
      });

      return { id: post.id, status: post.status, publicationIds };
    }),

  /** Schedule or reschedule. */
  schedule: brandProcedure
    .input(z.object({ id: z.string(), scheduledAt: z.date() }))
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "post.schedule — Phase 1C" });
    }),

  /** Publish immediately — transitions post to PUBLISHING and enqueues one job per platform. */
  publishNow: brandProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findFirst({
        where: { id: input.id, brandId: ctx.brand.id, deletedAt: null },
        include: {
          publications: {
            include: { connectedAccount: true },
          },
        },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      if (
        post.status === "PUBLISHING" ||
        post.status === "PUBLISHED" ||
        post.status === "PARTIALLY_FAILED"
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Post cannot be published again — current status: ${post.status}`,
        });
      }

      const expiredPlatforms = post.publications
        .filter((pub) => pub.connectedAccount.status !== "ACTIVE")
        .map((pub) => pub.connectedAccount.platform.toLowerCase());

      if (expiredPlatforms.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `The following platforms need reconnection: ${expiredPlatforms.join(", ")}`,
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.post.update({
          where: { id: post.id },
          data: { status: "PUBLISHING" },
        });

        await Promise.all(
          post.publications.map((pub) =>
            tx.postPublication.update({
              where: { id: pub.id },
              data: { status: "SCHEDULED" },
            }),
          ),
        );
      });

      const queuedJobIds = await Promise.all(
        post.publications.map((pub) => {
          const idempotencyKey = `post-publish-${pub.id}`;
          return ctx.postPublishQueue.enqueue({
            brandId: ctx.brand.id,
            postId: post.id,
            publicationId: pub.id,
            platform: pub.connectedAccount.platform.toLowerCase() as never,
            idempotencyKey,
          });
        }),
      );

      return { id: post.id, status: "PUBLISHING" as const, queuedJobIds };
    }),

  delete: brandProcedure.input(z.object({ id: z.string() })).mutation(async () => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "post.delete — Phase 1C" });
  }),
});
