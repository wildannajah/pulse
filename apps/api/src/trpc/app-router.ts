import { analyticsRouter } from "./routers/analytics-router";
import { brandRouter } from "./routers/brand-router";
import { healthRouter } from "./routers/health-router";
import { inboxRouter } from "./routers/inbox-router";
import { postRouter } from "./routers/post-router";
import { router } from "./trpc";

export const appRouter = router({
  health: healthRouter,
  brand: brandRouter,
  post: postRouter,
  inbox: inboxRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
