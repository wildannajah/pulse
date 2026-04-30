# Pulse — End-to-End Roadmap

A complete, sequenced checklist of everything between today and a shipped Phase 3 product. Items are grouped by phase. Within a phase, tasks are roughly ordered by dependency — earlier items unblock later ones.

Legend: `[x]` done · `[ ]` not started · `[~]` partial / in progress

> **Last reviewed: 2026-04-30.** UI work is currently blocked on the design system landing. Backend work (platform adapters, OAuth flows, BullMQ workers, tRPC procedures, validation schemas, AI provider integration) proceeds in parallel — when the design system arrives, UI becomes glue work against an already-built API surface.

---

## Phase 0 — Foundation (in progress)

The plumbing every feature depends on. None of this is in the PRD as a "feature" — it's the floor.

### Already done
- [x] PRD reviewed, MoSCoW priorities locked
- [x] Tech stack decided (Next.js 15 + tRPC + Tailwind v4 + shadcn frontend; NestJS + Prisma + Postgres + Redis/BullMQ backend)
- [x] Folder structure & kebab-case conventions (`CLAUDE.md`)
- [x] Database schema covering Phase 1–3 (Prisma, ~30 tables)
- [x] Turborepo monorepo scaffolded (`apps/web`, `apps/api`, `apps/workers`, `packages/*`)
- [x] Biome lint + format, lefthook pre-commit, commitlint
- [x] Prisma wired into NestJS (`PrismaService`, `@Global` `PrismaModule`, `enableShutdownHooks`)
- [x] Initial migration applied to Railway Postgres
- [x] Health endpoints (`/health`, `/health/db`)
- [x] Design spec document (13 sections)
- [x] Dashboard wireframe (desktop, interactive)
- [x] **Auth.js v5 wired in `apps/web` with custom Prisma adapter (schema field mapping)**
- [x] **Three providers: Credentials (bcrypt 12 rounds), Google OAuth, Resend magic link**
- [x] **Database session strategy with JWT encode override for Credentials compatibility**
- [x] **Sign-in / sign-up / verify-email pages with React Hook Form + Zod**
- [x] **Middleware protecting `/app/*` routes**
- [x] **`bootstrapWorkspace()` server action — atomic Workspace + Member + default Brand on first sign-in, idempotent**
- [x] **`SessionGuard` — Bearer token validation against sessions table, expiry check**
- [x] **`BrandScopeGuard` — `x-brand-id` header → workspace membership + brandAccess array enforcement**
- [x] **`@CurrentUser()` and `@CurrentBrand()` param decorators**
- [x] **`EncryptionService` (AES-256-GCM) for OAuth token storage**
- [x] **`/health/me` and `/health/brand` smoke endpoints**
- [x] **Vitest tests for both guards (5 critical paths covered, including cross-tenant rejection)**
- [x] **`VerificationToken` model + `add_verification_tokens` migration applied**
- [x] **tRPC v11 server wired into Nest** (`TrpcController` with `@All("*path")`, fetch adapter bridge, `createTrpcContext` reuses `resolveSession` + `resolveBrand` resolvers — DRY with guards)
- [x] **Three procedure helpers**: `publicProcedure` / `protectedProcedure` (session) / `brandProcedure` (session + brand, distinguishes `BAD_REQUEST` for missing header vs `FORBIDDEN` for inaccessible brand)
- [x] **tRPC client wired into Next.js** (`trpc.Provider` + `QueryClientProvider` in `providers.tsx`, `httpBatchLink` with superjson)
- [x] **`@pulse/api-types` shared package** (type-only `AppRouter` re-export so `apps/web` doesn't depend on `apps/api` at runtime)
- [x] **Session-token transport via server-side proxy** (`/api/trpc/[trpc]/route.ts` reads HTTP-only cookie, mints `Authorization: Bearer` for upstream — token never reaches JS)
- [x] **`useBrandStore()` Zustand store** with localStorage persistence; brand id sent as `x-brand-id` header by tRPC client
- [x] **API deployed to Railway** via multi-stage Dockerfile
- [x] **Web deployed to Vercel** with Prisma generate in build step

### Remaining foundation work
- [ ] BullMQ queues for all 4 types: `post-publish`, `token-refresh`, `analytics-sync`, `inbox-sync` (only `post-publish` stub exists)
- [ ] `JobLog` writes wired into worker lifecycle (start, success, failure)
- [ ] Sentry wired in `apps/api` and `apps/workers` with `brandId` + `platform` tags
- [ ] Cloudflare R2 (or S3) bucket configured for media uploads
- [ ] Rate limiting on auth + public endpoints
- [ ] CI: typecheck + lint + test + build on every PR
- [ ] Storybook deployed (Chromatic or Vercel) for design review
- [ ] Wireframes for the other 4 core screens (Composer, Calendar, Inbox, Analytics)
- [ ] Component inventory extracted from the design spec
- [ ] `@pulse/ui` populated with the first ~10 shared primitives (Button, Input, Card, etc.) — *blocked on design system*
- [ ] `packages/types/platform-constraints.ts` — per-platform char limits, hashtag caps, media specs from PRD §5 as single source of truth

### Product analytics & metrics tracking

Required to measure the success metrics PRD §3.2 commits us to (DAU, post-scheduling adoption, analytics engagement, team adoption, 30-day retention, NPS). **Must be wired before Phase 1 launch** — instrumenting after the fact loses the launch baseline.

- [ ] Choose product-analytics provider (PostHog vs Amplitude vs Mixpanel vs self-hosted) — *open question*
- [ ] Provider client SDK in `apps/web` (cookie consent + opt-out for GDPR)
- [ ] Provider server SDK in `apps/api` (server-side events for actions we don't want to trust the client for)
- [ ] Event taxonomy doc — minimum coverage for PRD §3.2:
  - `user.signed_up`, `user.signed_in`, `user.session_active` (DAU)
  - `post.scheduled`, `post.published` (scheduling adoption — target 5/week)
  - `analytics.viewed` (analytics engagement — target weekly view by 60%)
  - `team.member_invited`, `team.member_joined` (team adoption — target 2+ members)
  - `account.connected`, `account.disconnected` (per-platform connection funnel)
  - `nps.surveyed`, `nps.responded` (NPS — target ≥40 within 6 months)
- [ ] In-app NPS survey component (Delighted, Wootric, or DIY)
- [ ] Cohort retention dashboard (30-day target ≥65%)
- [ ] Reverse-ETL or warehouse export for deeper analysis (BigQuery/Snowflake) — *defer if PostHog is the choice; their built-in tools cover most of it*

### Open product questions (resolve before Phase 1 ships)
- [ ] **Pricing model** — freemium tiers, per-seat, per-account?
- [x] **Mobile** — *resolved per PRD §8: responsive web only for v1, native deferred*
- [ ] **AI provider** — Claude API, OpenAI, both? *PRD §9 assumes Claude; needs final call before 1H starts*
- [ ] **Product-analytics provider** — PostHog / Amplitude / Mixpanel / self-hosted?
- [ ] **White-labeling** — Phase 1 or Phase 3?
- [ ] **Data retention** — how long do we keep analytics history?
- [ ] **GDPR / CCPA** — DPA, data export, right-to-delete
- [x] **Auth account linking** — *resolved: `allowDangerousEmailAccountLinking` removed (commit `8b2729b`); manual link mode is the contract*

---

## Phase 1 — MVP (Weeks 1–8)

Everything marked **Must Have** in the PRD plus the **Should Have**s explicitly tagged Phase 1. Goal: a usable product end-to-end for a solo creator.

> **Currently unblocked (proceed in parallel with design):** 1B (OAuth + adapters, all backend), 1C backend half (worker, queue, validation schemas), 1F worker (`inbox-sync`), 1G worker (`analytics-sync`), 1H (AI provider integration once decided).
> **Waits for design system:** every "UI", "view", "card", "page", "modal", "drawer" item below.

### 1A — User auth & multi-brand workspace
- [x] Sign up / log in flows (frontend) — *partially done as part of Phase 0 auth*
- [x] Email verification flow *(via Resend magic link)*
- [ ] Password reset flow
- [x] Workspace creation on first login (Personal type)
- [x] Default Brand created with workspace
- [x] `useBrandStore()` Zustand store + brand-id propagation in API calls *(landed with tRPC wiring)*
- [ ] Workspace switcher UI (header dropdown) — *waits for design*
- [ ] Brand switcher UI (separate from workspace switcher) — *waits for design*
- [ ] User profile settings page — *waits for design*
- [ ] Account deletion (soft delete + queued hard-delete after grace period)

### 1B — OAuth Platform Connect (all 7 platforms)
**Per-platform infrastructure (build once, reuse)**
- [ ] `BasePlatformAdapter` interface — `publish()`, `fetchAnalytics()`, `refreshToken()`, `fetchInbox()`, `fetchProfile()`
- [ ] Platform adapter registry + factory
- [ ] OAuth callback route (`/api/auth/connect/[platform]/callback`)
- [ ] Encrypted token write to `connected_accounts` *(EncryptionService ready)*
- [ ] Connection status surfaced in UI (active / expired / revoked / error)
- [ ] Disconnect flow (revoke on platform side + delete from DB)
- [ ] Token refresh BullMQ job (hourly, refresh tokens expiring < 24h)
- [ ] Multi-account support per platform (e.g., 2 IG accounts on same brand)

**Per platform — register dev app, implement adapter, end-to-end test**
- [ ] Twitter / X — adapter, publish, refresh, profile
- [ ] LinkedIn — adapter, publish (personal + company pages), refresh, profile
- [ ] Facebook — adapter, publish to Pages, refresh, profile
- [ ] Instagram — adapter (Business via Graph API), publish, profile
- [ ] Threads — adapter, publish, profile
- [ ] TikTok — adapter, publish, profile (note: API access risk per PRD)
- [ ] YouTube — adapter, publish (Shorts only for v1?), profile

### 1C — Content Composer & Scheduler (4.2)
- [ ] Composer UI shell (left: editor, right: previews)
- [ ] Tiptap editor with platform-aware character counts
- [ ] Per-platform variant overrides (different text per platform)
- [ ] Media upload to R2 with progress + cancel
- [ ] Image cropper per platform aspect ratio
- [ ] Video upload + thumbnail extraction
- [ ] Live preview cards: Instagram, Twitter, LinkedIn, Facebook, Threads, TikTok, YouTube
- [ ] Date + time scheduler with timezone awareness
- [ ] Save as draft
- [ ] Schedule post (creates `Post` + `PostVariant` + `PostPublication` rows + enqueues BullMQ job)
- [ ] Publish-now path (bypasses schedule, enqueues immediately)
- [ ] `post-publish` worker actually publishes via the platform adapters
- [ ] Idempotent retry on transient failures with exponential backoff
- [ ] `PARTIALLY_FAILED` handling (some platforms succeed, some fail)
- [ ] Per-publication error surfacing back to UI

### 1D — Content Calendar (4.3)
- [ ] Calendar grid (monthly view)
- [ ] Weekly view toggle
- [ ] Platform color coding on each post chip
- [ ] Click a post → opens read-only detail drawer
- [ ] Edit scheduled post (only before publish window)
- [ ] Delete scheduled post (cancels BullMQ job)
- [ ] Filter by platform
- [ ] Filter by status (scheduled / published / draft / failed)

### 1E — Dashboard & Overview (4.1)
- [ ] Layout shell (sidebar + main + brand switcher)
- [ ] Per-platform status cards (followers, recent engagement, post performance)
- [ ] Unified feed: real-time activity across connected platforms
- [ ] Quick post button (floating, opens composer modal from any page)
- [ ] Notification bell with aggregated notifications (Phase 1 should-have)
- [ ] Empty states for "no connected accounts" and "no posts yet"

### 1F — Unified Inbox (4.4)
- [ ] `inbox-sync` worker pulls DMs / comments / mentions per connected account
- [ ] `InboxItem` rows created with deduplication
- [ ] Inbox list UI (chronological)
- [ ] Read / unread / resolved status toggles
- [ ] Reply UI (per-platform reply via adapter)
- [ ] Platform filter (Phase 1 should-have)
- [ ] Item type filter (DM / comment / mention)
- [ ] Optimistic UI for replies with rollback on failure

### 1G — Basic Analytics (4.5)
- [ ] `analytics-sync` worker pulls metrics per connected account daily
- [ ] `PostMetric` rows populated per publication
- [ ] Platform overview stats (followers, impressions, reach, engagement rate)
- [ ] Post performance table (sortable: likes, comments, shares, reach)
- [ ] Date range filter (7 days / 30 days / custom)
- [ ] Per-platform tab in analytics view
- [ ] CSV export of post performance table

### 1H — AI Caption Generator (4.6)
- [ ] AI provider integration (Anthropic Claude API per PRD assumptions)
- [ ] Prompt template: topic / keyword / image-description → caption
- [ ] "Generate caption" button in composer
- [ ] Generated caption inserts into editor with diff preview
- [ ] Per-platform tone tweaking (single button "make it shorter for Twitter")
- [ ] Usage tracking via `UsageRecord` for plan limits

### 1I — Phase 1 cross-cutting
- [x] Email service wired (Resend) — verification, magic link
- [ ] Email service: post-failure alerts, password-reset, notification emails
- [ ] Notification system end-to-end (in-app + email)
- [ ] Audit log writes for sensitive actions (account connect, post publish, user invited)
- [ ] Onboarding tour for new users
- [ ] Mobile-responsive layouts for all 5 core screens
- [ ] E2E tests: signup → connect IG → schedule post → see in calendar → see in analytics
- [ ] Beta launch checklist + feedback collection

---

## Phase 2 — Power user features (Weeks 9–16)

Should-haves from the PRD. Goal: make Pulse the daily driver for marketing teams.

### 2A — Advanced Analytics
- [ ] Follower growth line chart (Recharts)
- [ ] Engagement rate trend chart
- [ ] Reach + impressions trend charts
- [ ] Top posts report (auto-surfaced for selected period)
- [ ] Per-post deep-dive view (timeline of likes/comments/shares)

### 2B — Best Time AI suggestions
- [ ] Per-account historical engagement aggregation
- [ ] Best-time recommendation algorithm (heatmap by day/hour)
- [ ] "Suggested time" picker in composer
- [ ] Heatmap visualization in analytics

### 2C — Team & roles (4.7)
- [ ] Team invitations via email (signed link, expiring token)
- [ ] Role assignment: Owner / Admin / Editor / Viewer
- [ ] Role-based permission checks in every API route
- [ ] Permission UI in settings (who can do what)
- [ ] Workspace member list + remove member
- [ ] Activity log per member

### 2D — Approval workflow
- [ ] `PostApproval` model wired into composer flow
- [ ] "Submit for approval" state on posts
- [ ] Reviewer queue UI
- [ ] Approve / reject / request changes with comment
- [ ] Notification to author on review
- [ ] Cannot publish until approved (enforced server-side)

### 2E — Composer additions
- [ ] Hashtag Manager — `HashtagSet` CRUD + insert into composer
- [ ] Content Templates — `PostTemplate` CRUD + load into composer
- [ ] Saved Replies — `SavedReply` CRUD + insert into inbox reply
- [ ] AI tone adjustment ("rewrite as professional / casual / funny")
- [ ] Platform optimization suggestions (e.g., split long Twitter into thread)
- [ ] AI hashtag suggestions

### 2F — Calendar enhancements
- [ ] Drag-and-drop rescheduling (`@dnd-kit`)
- [ ] Draft slots (placeholder cards for unwritten content)
- [ ] Team calendar filter (filter by team member)

### 2G — Inbox enhancements
- [ ] Assign inbox item to team member
- [ ] Assignee filter
- [ ] Mention notification when assigned

### 2H — Dashboard enhancements
- [ ] Activity timeline (chronological log of team actions, scheduled posts, published content)

### 2I — Phase 2 cross-cutting
- [ ] Stripe billing integration (subscriptions, invoices, plan limits enforced)
- [ ] Plan upgrade / downgrade flow
- [ ] Usage dashboards (posts scheduled, AI generations, etc.)
- [ ] More aggressive E2E coverage (team flows, approval flows)

---

## Phase 3 — Agency & advanced (Weeks 17–24)

Could-haves. Goal: usable by agencies managing many clients.

### 3A — Agency client workspaces
- [ ] Workspace type = Agency unlocks multi-client mode
- [ ] Client onboarding flow (create brand, invite client to view-only)
- [ ] Per-client billing roll-up
- [ ] Client report sharing (public link with token)

### 3B — Bulk operations
- [ ] CSV upload UI with template download
- [ ] CSV parser + validation (Zod)
- [ ] Bulk preview before commit (shows errors per row)
- [ ] `BulkUpload` model writes + per-row `Post` creation
- [ ] Bulk reschedule
- [ ] Bulk delete

### 3C — Competitor benchmarking
- [ ] Add competitor by handle per platform
- [ ] Daily competitor metric scrape (where API allows)
- [ ] Side-by-side benchmark charts
- [ ] Competitor top-posts surfacing

### 3D — Reports
- [ ] PDF report generator (server-side render of analytics view)
- [ ] Scheduled report email delivery (weekly / monthly)
- [ ] Brand-customized report templates

### 3E — Sentiment & content intelligence
- [ ] Sentiment classifier on inbox items (positive / neutral / negative)
- [ ] Sentiment-filtered inbox view
- [ ] AI Content Ideas Generator (week of post ideas from brand niche)
- [ ] First Comment Scheduling (IG/FB)
- [ ] Content Gaps Highlight in calendar

### 3F — Customization
- [ ] Drag-and-drop dashboard widgets
- [ ] Saved dashboard layouts per user
- [ ] Custom date-range presets

### 3G — Programmatic access *(NOT in PRD — needs scope decision)*

> ⚠️ **Out of PRD scope as of v1.0.** Schema has `ApiKey` table (someone modeled it), but PRD §4–§7 doesn't mention a public API or webhooks anywhere. Either (a) drop this section, or (b) write a PRD addendum justifying the addition before building. Recommend (a) for v1 — agencies can request via support, real demand can drive a v1.1 addendum. Leaving items here for traceability only; **do not build until a PRD update lands.**

- [ ] `ApiKey` model wired with hashing + scopes
- [ ] API key management UI
- [ ] REST API documentation site
- [ ] Webhook subscription model (post.published, inbox.received)

### 3H — Phase 3 cross-cutting
- [ ] White-labeling (custom domain + logo) — if scoped to Phase 3
- [ ] Internationalization (i18n) — deferred per PRD assumptions, schedule decision
- [ ] SOC 2 readiness (if pursuing enterprise)

---

## Pre-launch — operational & legal

These run in parallel with Phase 1–3 dev. Don't ship without them.

- [ ] Marketing site (`apps/marketing` or external)
- [ ] Pricing page reflecting decided model
- [ ] Terms of Service
- [ ] Privacy Policy (with GDPR + CCPA addenda)
- [ ] Data Processing Agreement (DPA) for B2B customers
- [ ] Status page (uptime, incident history)
- [ ] Customer support inbox (Plain, Intercom, or email)
- [ ] Help docs / knowledge base
- [ ] Onboarding email sequence
- [ ] Backup + restore procedure documented and tested
- [ ] Incident response runbook
- [ ] On-call rotation (even if it's just one person)

---

## Quick scoreboard

- **Foundation (Phase 0):** 33 of ~48 done — tRPC end-to-end, deployment, and Zustand brand store landed since last review; product-analytics tracking section added (9 items)
- **Phase 1:** 7 of ~85 done — `useBrandStore` checked off as side-effect of tRPC wiring
- **Phase 2:** 0 of ~40 done
- **Phase 3:** 0 of ~30 done (3G "Programmatic access" flagged as out-of-PRD; 4 items there don't count toward Phase 3 burn-down)
- **Pre-launch:** 0 of ~12 done

Total surface area: ~215 trackable items. Foundation is ~85% complete — remaining chunks are BullMQ queues (3 of 4 still stubs), Sentry, R2/media storage, CI, Storybook deploy, and `@pulse/ui` primitives (the last is design-system-blocked).

**Next up while design is in flight (in priority order):**

1. **Decide AI provider + product-analytics provider** (two open questions above) — unblocks 1H and the Phase 0 metrics-tracking section respectively
2. **`BasePlatformAdapter` interface + Twitter/X end-to-end** (1B) — proves the pattern, lets the other 6 platforms fan out
3. **`packages/types/platform-constraints.ts`** — char limits / hashtag caps / media specs as one source of truth (consumed by composer validation later)
4. **`token-refresh` BullMQ worker** — depends on adapters being defined; prevents Phase 1 silent failures
5. **`post-publish` worker** filled in beyond the stub — wire it to the adapter registry
6. **`inbox-sync` and `analytics-sync` workers** — same pattern, run on cron via BullMQ repeat jobs
7. **tRPC procedures** for `connectedAccount.*`, `post.*`, `inbox.*`, `analytics.*`, `aiGeneration.*` — define the contract; UI later just calls these
8. **Wire chosen analytics provider** + minimum event taxonomy — instrument as features land, not in retrospect

Every item in this list is server-only, fully testable via Vitest + tRPC's `appRouter.createCaller(ctx)` pattern, and produces a complete API surface that the eventual UI consumes as glue.