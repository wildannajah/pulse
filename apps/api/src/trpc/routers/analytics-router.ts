import { z } from "zod";

import { brandProcedure, router } from "../trpc";

/**
 * Analytics router — brand-scoped aggregations.
 *
 * Phase 0: shape-only queries that return real Prisma rows where the data
 * already exists; aggregations land in 1G when the analytics-sync worker is
 * populating snapshots reliably.
 */

const PlatformEnum = z.enum([
  "instagram",
  "twitter",
  "facebook",
  "linkedin",
  "threads",
  "tiktok",
  "youtube",
]);

export const analyticsRouter = router({
  /** Latest snapshot per ConnectedAccount for the active brand. */
  brandOverview: brandProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.connectedAccount.findMany({
      where: { brandId: ctx.brand.id, status: "ACTIVE" },
      include: {
        analyticsSnapshots: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });
    return accounts.map((a) => ({
      platform: a.platform,
      connectedAccountId: a.id,
      latest: a.analyticsSnapshots[0] ?? null,
    }));
  }),

  /** Time series for one platform across a date range. */
  followerGrowth: brandProcedure
    .input(
      z.object({
        platform: PlatformEnum,
        from: z.date(),
        to: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await ctx.prisma.connectedAccount.findFirst({
        where: {
          brandId: ctx.brand.id,
          platform: input.platform.toUpperCase() as never,
          status: "ACTIVE",
        },
      });
      if (!account) return [];
      return ctx.prisma.analyticsSnapshot.findMany({
        where: {
          connectedAccountId: account.id,
          date: { gte: input.from, lte: input.to },
        },
        orderBy: { date: "asc" },
      });
    }),

  /** Top posts by reach for the active brand within a date range. */
  topPosts: brandProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.postMetric.findMany({
        where: {
          publication: { post: { brandId: ctx.brand.id } },
          snapshotAt: { gte: input.from, lte: input.to },
        },
        orderBy: { reach: "desc" },
        take: input.limit,
        include: { publication: { include: { post: true } } },
      });
    }),
});
