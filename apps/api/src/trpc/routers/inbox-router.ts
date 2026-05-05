import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { brandProcedure, router } from "../trpc";

/**
 * Inbox router — brand-scoped messages from connected accounts.
 *
 * Phase 0: list/markRead query Prisma; reply is a stub (depends on platform
 * adapters in 1B). When inbox-sync workers are wired, the data simply appears.
 */

export const inboxRouter = router({
  list: brandProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
          platform: z
            .enum(["instagram", "twitter", "facebook", "linkedin", "threads", "tiktok", "youtube"])
            .optional(),
          status: z.enum(["unread", "read", "resolved"]).optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.inboxItem.findMany({
        where: {
          brandId: ctx.brand.id,
          ...(input.platform ? { platform: input.platform.toUpperCase() as never } : {}),
          ...(input.status ? { status: input.status.toUpperCase() as never } : {}),
        },
        orderBy: { receivedAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const nextCursor = items.length > input.limit ? items.pop()?.id : null;
      return { items, nextCursor };
    }),

  get: brandProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const item = await ctx.prisma.inboxItem.findFirst({
      where: { id: input.id, brandId: ctx.brand.id },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!item) throw new TRPCError({ code: "NOT_FOUND" });
    return item;
  }),

  markRead: brandProcedure.input(z.object({ id: z.string() })).mutation(async () => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "inbox.markRead — Phase 1F" });
  }),

  reply: brandProcedure
    .input(z.object({ id: z.string(), text: z.string().min(1).max(2000) }))
    .mutation(async () => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "inbox.reply — depends on platform adapter (Phase 1B)",
      });
    }),
});
