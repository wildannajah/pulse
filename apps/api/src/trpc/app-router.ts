import { analyticsRouter } from "./routers/analytics-router";
import { brandRouter } from "./routers/brand-router";
import { connectedAccountRouter } from "./routers/connected-account-router";
import { healthRouter } from "./routers/health-router";
import { inboxRouter } from "./routers/inbox-router";
import { mediaRouter } from "./routers/media-router";
import { postRouter } from "./routers/post-router";
import { router } from "./trpc";

export const appRouter = router({
  health: healthRouter,
  brand: brandRouter,
  post: postRouter,
  media: mediaRouter,
  inbox: inboxRouter,
  analytics: analyticsRouter,
  // Phase B: startOAuth only. list / disconnect / refreshNow land in Phase C / G.
  connectedAccount: connectedAccountRouter,
});

export type AppRouter = typeof appRouter;
