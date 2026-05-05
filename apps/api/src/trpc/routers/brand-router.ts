import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

/**
 * Brand router — workspace-scoped CRUD on brands the user can access.
 *
 * Phase 0 contract: queries return real Prisma rows; mutations are stubs that
 * surface the contract but throw NOT_IMPLEMENTED until ownership/audit logic
 * lands. Apps/web can already wire `trpc.brand.list.useQuery()` against this.
 */

const BrandSummary = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  workspaceId: z.string(),
  createdAt: z.date(),
});

export const brandRouter = router({
  /** All brands the current user has access to across their workspaces. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.workspaceMember.findMany({
      where: { userId: ctx.user.id },
      select: { workspaceId: true, brandAccess: true },
    });
    const workspaceIds = memberships.map((m) => m.workspaceId);

    const brands = await ctx.prisma.brand.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true, workspaceId: true, createdAt: true },
    });

    // Filter by per-member brandAccess array when non-empty
    const accessByWorkspace = new Map(memberships.map((m) => [m.workspaceId, m.brandAccess]));
    return brands.filter((b) => {
      const access = accessByWorkspace.get(b.workspaceId);
      return !access || access.length === 0 || access.includes(b.id);
    });
  }),

  /** A single brand by id; throws NOT_FOUND if the user can't access it. */
  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const brand = await ctx.prisma.brand.findFirst({
      where: {
        id: input.id,
        deletedAt: null,
        workspace: { members: { some: { userId: ctx.user.id } } },
      },
    });
    if (!brand) throw new TRPCError({ code: "NOT_FOUND" });
    return brand;
  }),

  /** Update name/slug/logo on the active brand. Mutation contract only for now. */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(80).optional(),
        slug: z
          .string()
          .min(1)
          .max(80)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "brand.update — Phase 1B" });
    }),

  _shape: protectedProcedure.query(() => BrandSummary.shape),
});
