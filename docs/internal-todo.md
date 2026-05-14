# Pulse — Internal Tool TODO

The plan we're actually executing. Scope: build a working social-media management tool for our team. SaaS launch comes later — see `ROADMAP.MD` for the strategic plan + PRD alignment.

> **Operating principle:** substrate is SaaS-grade from day one (so M3 public launch is bolt-on, not refactor); public-facing artifacts (billing, marketing, legal, support) wait until we go public.

> **Last reviewed: 2026-05-14.**

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
- [x] `BasePlatformAdapter` extended with `buildAuthorizationUrl()` + `exchangeAuthCode()` (Phase B finish)
- [x] `apps/api/src/platforms/adapter-registry.ts` — `getAdapter(platform: Platform)` factory
- [x] OAuth callback route — `GET /oauth/:platform/callback` on `apps/api` (see Phase B decision log below)
- [x] Decision: OAuth callback origin — **apps/api directly** (EncryptionService + Prisma + adapter all colocated; one fewer hop)
- [x] `OAuthStateService` (HMAC-signed stateless state token, 10-min TTL)
- [x] tRPC `connectedAccount.startOAuth` brand procedure (returns authorization URL)

### Phase C — Twitter/X end-to-end (~3 days, pilot platform)
- [x] Register Twitter dev app (manual step) — get client ID + secret into env
- [x] `TwitterAdapter implements BasePlatformAdapter`
- [x] OAuth 2.0 + PKCE callback handler
- [x] Encrypted token write to `ConnectedAccount` (encryption service ready)
- [x] tRPC procedure: `connectedAccount.startOAuth(platform)` returns auth URL
- [x] tRPC procedure: `connectedAccount.list / disconnect`
- [x] `post-publish` worker actually dispatches via the adapter
- [x] `post.create` + `post.publishNow` mutations (producer side wired)
- [x] First real tweet published via Pulse 🎉 — **2026-05-14** end-to-end flow verified:
  composer → `post.create` → `post.publishNow` → BullMQ `post-publish` job →
  `TwitterAdapter.publish()` → `https://api.x.com/2/tweets` → `PostPublication.status = PUBLISHED`

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
### Phase F1 — Meta (Facebook + Instagram, shared OAuth) — IN PROGRESS
- [x] Meta Developer App registered + Facebook Login for Business product added
- [x] Valid OAuth redirect URIs configured (prod + localhost, FB + IG)
- [x] App ID + App Secret obtained
- [x] `META_APP_ID` + `META_APP_SECRET` added to `env-schema.ts`
- [x] `META_APP_ID` + `META_APP_SECRET` added to `.env.example` (apps/api + apps/workers)
- [ ] `META_APP_ID` + `META_APP_SECRET` added to Railway `apps/api` env (manual step)
- [ ] `META_APP_ID` + `META_APP_SECRET` added to Railway `apps/workers` env (manual step)
- [ ] `META_APP_ID` + `META_APP_SECRET` added to local `.env` files (manual step)
- [x] `apps/api/src/platforms/meta/meta-api-types.ts` — Graph API response types
- [x] `apps/api/src/platforms/meta/meta-adapter.ts` — shared adapter for FB + IG
- [x] `adapter-registry.ts` — `MetaAdapter` wired for facebook + instagram
- [x] `PublishInput` extended with `platformUserId` + `platformPageId`
- [x] `post-publish.worker.ts` passes platform IDs to adapter
- [ ] OAuth end-to-end test: connect Facebook Page → `ConnectedAccount` row written
- [ ] OAuth end-to-end test: connect Instagram Business → `ConnectedAccount` row written
- [ ] First real Facebook Page post published via Pulse
- [ ] First real Instagram post published via Pulse *(blocked on R2 media upload — Phase D)*
- [ ] Webhook handlers: `/webhooks/meta/deauthorize` + `/webhooks/meta/data-deletion`
- [ ] App Review submission (only blocks public launch — internal testing works in dev mode)

### Phase F2 — LinkedIn (~2 days)
- [ ] LinkedIn — adapter + OAuth + publish (personal + company pages) + refresh

### Phase F3 — Threads / TikTok / YouTube (~2-3 days each, can parallelize)
- [ ] Threads — adapter + OAuth + publish *(API access risk per PRD §9)*
- [ ] TikTok — adapter + OAuth + publish *(API access risk; no DM access)*
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
- [~] Sidebar navigation (Dashboard / Calendar / Composer / Inbox / Analytics / Settings)
- [ ] Top bar with brand switcher dropdown + user menu
- [ ] Workspace switcher (only relevant if team has multiple workspaces)
- [ ] Empty states for "no connected accounts" everywhere

### Phase K — Composer
- [~] Composer page layout (left: editor, right: previews)
- [ ] Tiptap editor with platform-aware char counts
- [ ] Per-platform variant overrides (toggle "different text for Twitter")
- [ ] Media upload UI (drag-drop + click-to-upload + progress + cancel)
- [ ] Per-platform preview cards (Instagram, Twitter, LinkedIn, Facebook, Threads, TikTok, YouTube)
- [ ] Date+time scheduler (react-day-picker + time input + TZ selector)
- [~] Save draft / Schedule / Publish-now buttons
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
- [x] Connected accounts list (per platform, status, disconnect, refresh)
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

- **Backend phases:** A 2/2 · B 7/7 · C 8/9 · D 0/5 · E 0/8 · F 0/6 · G 0/10 · H 0/5 · I 0/4 → **16 of ~53 done**
- **Frontend phases:** J 0/4 · K 0/10 · L 0/8 · M 0/8 · N 0/8 · O 0/4 · P 0/6 → **0 of ~48 done**
- **SaaS-readiness:** 10 of 21 done (the schema/architecture half)

**First milestone:** Phase A + B + D + C complete = first tweet published via Pulse end-to-end. Target: ~1 week of focused work after AI/workers hosting decisions land.

---

## Decision log

### Session log

---

- **2026-05-14** — Twitter end-to-end publish verified ✅. Meta Developer App
  registered; Facebook + Instagram OAuth redirect URIs configured for prod +
  localhost. `MetaAdapter` implementation landed (FB end-to-end; IG OAuth +
  account discovery working, publish blocked on R2 media upload).

---

### 2026-05-13 — OAuth callback origin

`apps/api` hosts `GET /oauth/:platform/callback` directly. State is an HMAC-signed
opaque token (`OAuthStateService`, 10-min TTL) issued by the `connectedAccount.startOAuth`
tRPC mutation. Rationale: `EncryptionService`, Prisma, and adapter code all live
in `apps/api`; routing the callback through `apps/web` would add one extra hop and
duplicate the encryption boundary without any UX benefit. The user-facing
landing page after success is still `apps/web` — done via `302` to
`${WEB_ORIGIN}/app/settings/connections?status=…`.

### 2026-05-14 — Mock data removed

All references to `apps/web/src/lib/mock-data.ts` deleted. Pages now read from
real tRPC procedures or render explicit empty states. Mock fallback in the
sidebar brand switcher replaced with `trpc.brand.list`. `PostStatus` type
relocated to `@pulse/types/post-status`.
