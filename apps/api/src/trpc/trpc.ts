import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { TrpcContext } from "./trpc-context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const brandProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.brandIdHeader) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "x-brand-id header required" });
  }
  if (!ctx.brand) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Brand not accessible" });
  }
  return next({ ctx: { ...ctx, brand: ctx.brand } });
});
