import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { brandProcedure, router } from "../trpc";

/**
 * Post router — brand-scoped post lifecycle.
 *
 * Read paths are wired against Prisma so the calendar, posts, and dashboard
 * pages can swap mock data for real queries. Write paths surface the contract
 * but throw NOT_IMPLEMENTED until 1C composer/scheduler lands.
 */

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

  /** Create a draft. Mutation contract only — full implementation in 1C. */
  create: brandProcedure
    .input(
      z.object({
        text: z.string().max(63206), // largest platform char limit
        platforms: z
          .array(
            z.enum([
              "instagram",
              "twitter",
              "facebook",
              "linkedin",
              "threads",
              "tiktok",
              "youtube",
            ]),
          )
          .min(1),
        scheduledAt: z.date().optional(),
        mediaKeys: z.array(z.string()).max(10).default([]),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "post.create — Phase 1C" });
    }),

  /** Schedule or reschedule. */
  schedule: brandProcedure
    .input(z.object({ id: z.string(), scheduledAt: z.date() }))
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "post.schedule — Phase 1C" });
    }),

  /** Publish-now path (bypasses scheduler, enqueues immediately). */
  publishNow: brandProcedure.input(z.object({ id: z.string() })).mutation(async () => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "post.publishNow — Phase 1C" });
  }),

  delete: brandProcedure.input(z.object({ id: z.string() })).mutation(async () => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "post.delete — Phase 1C" });
  }),
});
