import { brandProcedure, protectedProcedure, router } from "../trpc";

export const healthRouter = router({
  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    email: ctx.user.email,
  })),

  brand: brandProcedure.query(({ ctx }) => ({
    id: ctx.brand.id,
    name: ctx.brand.name,
  })),
});
