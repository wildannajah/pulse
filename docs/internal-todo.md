# Pulse — Internal Tool TODO

The plan we're actually executing. Scope: build a working social-media management tool for our team. SaaS launch comes later — see `ROADMAP.MD` for the strategic plan + PRD alignment.

> **Operating principle:** substrate is SaaS-grade from day one (so M3 public launch is bolt-on, not refactor); public-facing artifacts (billing, marketing, legal, support) wait until we go public.

> **Last reviewed: 2026-05-06.**

Legend: `[x]` done · `[ ]` not started · `[~]` partial / in progress

---

## Decisions blocking work

- [ ] **AI provider** — Claude API / OpenAI / both? *PRD §9 assumes Claude*
- [x] **Workers hosting** — Railway (deployed; post-publish worker live)
- [x] **Design system** — violet pastel on shadcn adopted (`docs/design.md` is live; re-skin in progress)
- [ ] **Approval workflow** — needed for our team, or skip?
- [x] **Brand setup** — multiple brands per workspace (full multi-brand architecture applies)

---

## Backend work (no design-system dependency, fully unblocked)

### Phase A — Foundation cleanup (do first, ~1 day)
- [x] `packages/types/platform-constraints.ts` — char limits, hashtag caps, media specs, video duration, API rate limits per platform from PRD §5
- [x] `packages/types/event-types.ts` — typed BullMQ job payloads (post-publish, token-refresh, analytics-sync, inbox-sync)

### Phase B — Platform adapter layer (~2 days)
- [x] `apps/api/src/platforms/base-platform-adapter.ts` — interface: `publish() / fetchAnalytics() / refreshToken() / fetchInbox() / fetchProfile() / revokeToken()` (+ `reply()`)
- [x] `apps/api/src/platforms/adapter-registry.ts` — `getAdapter(platform: Platform)` factory
- [ ] OAuth callback route shape: `/api/oauth/{platform}/callback` (Next.js handler that proxies to api?) or direct on apps/api
- [ ] Decision: OAuth callback origin — apps/web (then proxy) or apps/api directly?

### Phase C — Twitter/X end-to-end (~3 days, pilot platform)
- [ ] Register Twitter dev app (manual step) — get client ID + secret into env
- [ ] `TwitterAdapter implements BasePlatformAdapter`
- [ ] OAuth 2.0 + PKCE callback handler
- [ ] Encrypted token write to `ConnectedAccount` (encryption service ready)
- [ ] tRPC procedure: `connectedAccount.startOAuth(platform)` returns auth URL
- [ ] tRPC procedure: `connectedAccount.list / disconnect`
- [ ] `post-publish` worker actually dispatches via the adapter
- [ ] First real tweet published via Pulse 🎉

### Phase D — Storage (~1 day)
- [ ] Cloudflare R2 bucket provisioned
- [ ] Signed-URL upload flow (server issues upload URL, client never sees R2 credentials)
- [ ] Path structure: `{workspaceId}/{brandId}/{kind}/{id}.{ext}` — tenant isolation as defense in depth
- [ ] `apps/api/src/storage/r2.service.ts` — issuer + delete helpers
- [ ] tRPC procedure: `media.requestUpload({ kind, brandId })` returns signed URL + final asset key
- [ ] PostMedia row writes after upload completes (client confirms via separate procedure)

### Phase E — Workers deployment + remaining queues (~2 days)
- [x] `apps/workers` Dockerfile (mirror `apps/api`'s pattern)
- [x] Deploy as Railway service (separate from API; same project for private Redis URL)
- [~] `token-refresh` queue worker — runs hourly, refreshes tokens expiring within 24h, marks `ConnectedAccount.status = "expired"` on failure
- [~] `analytics-sync` queue worker — runs daily per brand, populates `AnalyticsSnapshot` + `PostMetric`
- [~] `inbox-sync` queue worker — runs every 5min per connected account, populates `InboxItem`
- [ ] BullMQ repeat jobs configured (cron-style schedules)
- [ ] Idempotency keys on every job (e.g. `post-publish:{publicationId}`)
- [ ] `JobLog` writes on start/success/failure with `brandId` + `platform` tags

### Phase F — Other 6 platforms (~2-3 days each, can parallelize)
- [ ] LinkedIn — adapter + OAuth + publish (personal + company pages) + refresh
- [ ] Facebook — adapter + OAuth + publish to Pages + refresh
- [ ] Instagram — adapter (Business via Graph API) + OAuth (note: needs FB Page) + publish
- [ ] Threads — adapter + OAuth + publish *(note: API access risk per PRD §9)*
- [ ] TikTok — adapter + OAuth + publish *(note: API access risk; no DM access)*
- [ ] YouTube — adapter + OAuth + publish (Shorts only for now?) + analytics

### Phase G — tRPC procedures (parallel to platform work)
- [ ] `brand.list / get / update / create`
- [ ] `connectedAccount.startOAuth / list / disconnect / refreshNow`
- [ ] `post.create / update / list / delete / schedule / publishNow / cancel`
- [ ] `postVariant.update` — per-platform overrides
- [ ] `inbox.list / get / reply / markRead / assign`
- [ ] `analytics.brandOverview / postMetrics / topPosts`
- [ ] `aiGeneration.caption / hashtags / toneAdjust`
- [ ] `hashtagSet.list / create / update / delete`
- [ ] `postTemplate.list / create / update / delete`
- [ ] `savedReply.list / create / update / delete`

### Phase H — AI integration (~1-2 days, depends on AI provider decision)
- [ ] AI provider SDK in `apps/api`
- [ ] Prompt templates: caption from topic/keyword, tone adjustment, hashtag suggestions
- [ ] `aiGeneration.*` tRPC procedures
- [ ] `AiGeneration` row writes for every call (audit + future usage tracking)
- [ ] Per-platform character-limit awareness in prompts

### Phase I — Observability
- [ ] Sentry wired in `apps/api` and `apps/workers`
- [ ] Sentry tags: `brandId`, `platform`, `userId` (where applicable), `procedure` (for tRPC)
- [ ] Sentry source maps uploaded in CI later
- [ ] Backup verification — restore Railway Postgres backup into a scratch DB, confirm data integrity, document procedure

---

## Frontend work (built on shadcn defaults; re-skin later when design system lands)

### Phase J — App shell
- [ ] Sidebar navigation (Dashboard / Calendar / Composer / Inbox / Analytics / Settings)
- [ ] Top bar with brand switcher dropdown + user menu
- [ ] Workspace switcher (only relevant if team has multiple workspaces)
- [ ] Empty states for "no connected accounts" everywhere

### Phase K — Composer
- [ ] Composer page layout (left: editor, right: previews)
- [ ] Tiptap editor with platform-aware char counts
- [ ] Per-platform variant overrides (toggle "different text for Twitter")
- [ ] Media upload UI (drag-drop + click-to-upload + progress + cancel)
- [ ] Per-platform preview cards (Instagram, Twitter, LinkedIn, Facebook, Threads, TikTok, YouTube)
- [ ] Date+time scheduler (react-day-picker + time input + TZ selector)
- [ ] Save draft / Schedule / Publish-now buttons
- [ ] Hashtag picker (loads `HashtagSet` rows)
- [ ] Template loader (loads `PostTemplate` rows)
- [ ] AI generate button → caption / tone / hashtags

### Phase L — Calendar
- [ ] Monthly grid view
- [ ] Weekly view toggle
- [ ] Platform color coding on post chips
- [ ] Click chip → read-only detail drawer
- [ ] Edit scheduled post (only if before publish window)
- [ ] Drag-drop reschedule (`@dnd-kit`)
- [ ] Filter by platform / status / team member
- [ ] Draft slot placeholders

### Phase M — Inbox
- [ ] Chronological list view
- [ ] Read / unread / resolved status toggles
- [ ] Per-platform filter
- [ ] DM / comment / mention type filter
- [ ] Reply UI (per-platform via adapter)
- [ ] Optimistic UI for replies + rollback on failure
- [ ] Saved replies picker
- [ ] Assign to team member (if approval workflow on)

### Phase N — Analytics
- [ ] Brand overview cards (followers, impressions, reach, engagement rate)
- [ ] Post performance table (sortable: likes, comments, shares, reach)
- [ ] Date range filter
- [ ] Per-platform tab
- [ ] Follower growth line chart (Recharts)
- [ ] Engagement rate trend chart
- [ ] Top posts panel
- [ ] CSV export of post performance

### Phase O — Dashboard
- [ ] Per-platform status cards
- [ ] Unified feed (chronological recent activity)
- [ ] Quick post button (floating, opens composer modal)
- [ ] Notification bell with aggregated notifications

### Phase P — Settings
- [ ] User profile (name, email, avatar, password change)
- [ ] Workspace settings (name, members list)
- [ ] Brand settings (name, slug, logo, default hashtags)
- [ ] Connected accounts list (per platform, status, disconnect, refresh)
- [ ] Team management (invite, role assignment, remove) *if team workflow on*
- [ ] Notification preferences

---

## SaaS-readiness checklist (do during the work above, not later)

These items are **cheap if done as you build, expensive to retrofit:**

- [x] Multi-tenant schema (Workspace + WorkspaceMember + Brand + brandAccess array)
- [x] `BrandScopeGuard` enforces tenant boundaries on REST
- [x] `brandProcedure` enforces tenant boundaries on tRPC
- [x] OAuth tokens encrypted at rest (AES-256-GCM)
- [x] AuditLog table modeled
- [x] Soft-delete fields on key models (`deletedAt`)
- [x] FeatureFlag table modeled
- [x] Subscription / Invoice / UsageRecord tables modeled
- [x] Prisma migrations workflow (no `db push` to shared DBs)
- [x] tRPC error formatter for consistent responses
- [ ] **R2 paths use `{workspaceId}/{brandId}/...`** (defense in depth)
- [ ] **AuditLog writes wired** for: account connect/disconnect, post publish, user invite, role change, brand create/delete, OAuth refresh failure
- [ ] **Idempotency keys** on every BullMQ job
- [ ] **Idempotency keys passed to external APIs** that support them (Stripe later, Twitter's `X-Idempotency-Key` for posts, etc.)
- [ ] **UTC storage + user-TZ display** end-to-end (composer, calendar, analytics dates)
- [ ] **Tenant isolation tests** — at minimum one Vitest test per protected procedure asserting cross-tenant access fails
- [ ] **Sentry per-tenant tagging** (brandId, platform, userId)
- [ ] **Per-tenant rate-limit helper** — even before implementing rate limits, structure the helper to accept workspaceId so M2 wiring is one line per endpoint
- [ ] **DB connection pooling decision** — direct Prisma → Postgres works for our team's traffic; document the path to PgBouncer / Accelerate for SaaS scale
- [ ] **OAuth scope minimization** — request smallest scopes per platform; document in adapter

---

## What we're explicitly NOT doing yet

These are real items in `ROADMAP.MD` (full SaaS plan) but deferred for the internal tool. Don't accidentally build them:

- ❌ Marketing site
- ❌ Pricing page + Stripe billing wiring
- ❌ ToS / Privacy Policy / DPA
- ❌ Real production domain (auto-domains are fine)
- ❌ Email deliverability tuning (SPF/DKIM/DMARC) beyond defaults
- ❌ Rate limiting (no public attack surface; build the *hook* but don't enforce)
- ❌ CI pipeline (run `pnpm typecheck && lint && test && build` locally before push)
- ❌ Status page, customer support inbox, on-call rotation
- ❌ Help docs / knowledge base / onboarding email sequence
- ❌ White-labeling
- ❌ Product analytics / event tracking *(on hold)*
- ❌ Programmatic access — API keys + webhooks *(out of PRD scope)*
- ❌ NPS surveys / cohort retention dashboards
- ❌ GDPR / CCPA pre-launch compliance (revisit at M3)
- ❌ Bulk CSV upload, competitor benchmarking, PDF reports, sentiment tagging — *Phase 3 features, defer to M3 or post-internal-stable*

---

## Order of work (priority queue)

Rough sequence — adjust as decisions land:

1. **Decide AI provider + workers hosting + design system** (blocks downstream)
2. **Phase A: platform-constraints + event-types** (~1 day, no decisions needed, unblocks everything)
3. **Phase B: BasePlatformAdapter interface + registry** (~1 day)
4. **Phase D: R2 bucket + signed-URL flow** (~1 day, can parallelize with Phase B)
5. **Phase C: Twitter end-to-end** (~3 days; the proof that the pattern works)
6. **Phase E: Workers deployment + remaining queues** (~2 days; without this, scheduling is dead)
7. **Phase G partial: brand.* + connectedAccount.* + post.* tRPC** (~2 days)
8. **Phase J: App shell on shadcn** (~1 day)
9. **Phase K: Composer UI** (~3-4 days)
10. **Phase L: Calendar UI** (~2 days)
11. **Phase F: Other 6 platforms** (parallelize aggressively; ~2-3 days each)
12. **Phase H: AI integration** (~1-2 days)
13. **Phase M: Inbox UI** (~2 days)
14. **Phase N: Analytics UI** (~3 days)
15. **Phase O: Dashboard** (~2 days)
16. **Phase P: Settings** (~2 days)
17. **Phase I: Sentry + backup verification** (~half day; do anytime once Phase E is up)

Rough total: 6–8 weeks of focused work for a single developer; faster with the team. Phase F (other 6 platforms) is the most parallelizable.

---

## Status tracker

Update this section as work progresses.

> **Scope note:** Phases A–P are *feature-layer* work that begins after the Phase 0
> foundation is in place. Foundation work (auth, tRPC, guards, deployment, encryption,
> Prisma migrations, etc.) is tracked in `ROADMAP.MD` under Phase 0 — not here.
> The `0/52` and `0/48` numbers reflect feature-phase progress only and are not a
> measure of total project progress.

- **Backend phases:** A 2/2 · B 2/4 · C 0/8 · D 0/5 · E 0/8 · F 0/6 · G 0/10 · H 0/5 · I 0/4 → **4 of ~52 done**
- **Frontend phases:** J 0/4 · K 0/10 · L 0/8 · M 0/8 · N 0/8 · O 0/4 · P 0/6 → **0 of ~48 done**
- **SaaS-readiness:** 10 of 21 done (the schema/architecture half)

**First milestone:** Phase A + B + D + C complete = first tweet published via Pulse end-to-end. Target: ~1 week of focused work after AI/workers hosting decisions land.
