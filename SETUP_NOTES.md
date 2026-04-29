# Pulse — Monorepo Setup Notes

Production-ready Turborepo scaffold for the Pulse multi-tenant social media management platform. This document records the decisions, the verified versions, the layout, and the commands needed to verify everything from a clean clone.

> Generated 2026-04-28. All version numbers were resolved with `npm view <pkg> version` against the public registry at the time of scaffolding.

---

## Tree

```
pulse/
├── .editorconfig
├── .gitignore
├── .npmrc                       # auto-install-peers, shamefully-hoist
├── .nvmrc                       # 20
├── biome.json                   # lint + format + import sort
├── commitlint.config.cjs
├── lefthook.yml                 # pre-commit + commit-msg
├── package.json                 # root scripts, devDeps, onlyBuiltDependencies
├── pnpm-lock.yaml
├── pnpm-workspace.yaml          # apps/* + packages/*
├── turbo.json                   # build/dev/lint/typecheck/test pipelines
│
├── apps/
│   ├── web/                     # Next.js 15 + React 19 + Tailwind v4 + shadcn/ui
│   │   ├── .env.example
│   │   ├── .storybook/{main.ts, preview.tsx}
│   │   ├── components.json      # shadcn config (new-york, neutral)
│   │   ├── e2e/home.spec.ts
│   │   ├── next.config.ts       # transpilePackages for @pulse/*
│   │   ├── playwright.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── public/mockServiceWorker.js
│   │   ├── src/
│   │   │   ├── app/{layout.tsx, page.tsx, providers.tsx}
│   │   │   ├── components/ui/   # shadcn primitives (button, dialog, etc.)
│   │   │   ├── lib/
│   │   │   │   ├── hooks/
│   │   │   │   ├── trpc/
│   │   │   │   └── utils/{cn.ts, cn.test.ts}
│   │   │   ├── stores/
│   │   │   ├── styles/globals.css   # Tailwind v4 + shadcn theme + @custom-variant dark
│   │   │   └── types/
│   │   ├── stories/ui/button.stories.tsx
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── vitest.setup.ts
│   │
│   ├── api/                     # NestJS 11 + Prisma 6 + Postgres
│   │   ├── .env.example
│   │   ├── Dockerfile           # multi-stage builder/runner for Railway
│   │   ├── nest-cli.json
│   │   ├── prisma/
│   │   │   ├── migrations/      # initial_schema applied to Railway Postgres
│   │   │   └── schema.prisma    # full Pulse model (~30 tables, PRD Phase 1–3)
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── config/env-schema.ts # Zod validateEnv
│   │   │   ├── health/{health.controller.ts, health.module.ts}  # /health + /health/db
│   │   │   ├── prisma/{prisma.module.ts, prisma.service.ts}     # @Global, lifecycle-managed
│   │   │   └── main.ts          # CORS + enableShutdownHooks
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   │
│   └── workers/                 # BullMQ workers
│       ├── .env.example
│       ├── src/
│       │   ├── main.ts          # SIGINT/SIGTERM shutdown
│       │   ├── queues/post-publish.worker.ts
│       │   └── redis.ts
│       ├── tsconfig.build.json
│       └── tsconfig.json
│
└── packages/
    ├── config/                  # shared tsconfig presets
    │   └── tsconfig/{base, nextjs, nestjs, node, react-library}.json
    ├── schemas/                 # @pulse/schemas — Zod
    │   └── src/identifier-schema.ts
    ├── types/                   # @pulse/types — TS-only
    │   └── src/branded-types.ts
    └── ui/                      # @pulse/ui — shared React components (placeholder)
        └── src/
```

---

## Versions (pinned, registry-verified)

### Root tooling

| Package                                   | Version  | Notes                                |
| ----------------------------------------- | -------- | ------------------------------------ |
| `pnpm`                                    | 10.33.2  | `packageManager` field               |
| `turbo`                                   | 2.9.6    | Monorepo task runner                 |
| `typescript`                              | 5.9.3    | Pinned exact across the workspace    |
| `@biomejs/biome`                          | 2.4.13   | Replaces ESLint + Prettier           |
| `lefthook`                                | 2.1.6    | Git hooks                            |
| `@commitlint/cli`                         | 20.5.2   | Commit-msg hook                      |
| `@commitlint/config-conventional`         | 20.5.0   | Conventional commits ruleset         |

### `apps/web`

Runtime:

| Package                       | Version  |
| ----------------------------- | -------- |
| `next`                        | 15.5.15  |
| `react` / `react-dom`         | 19.2.5   |
| `zustand`                     | 5.0.12   |
| `@tanstack/react-query`       | 5.100.5  |
| `react-hook-form`             | 7.74.0   |
| `@hookform/resolvers`         | 3.10.0   |
| `zod`                         | 3.25.76  |
| `date-fns`                    | 3.6.0    |
| `date-fns-tz`                 | 3.2.0    |
| `@trpc/client` / `server` / `react-query` | 11.16.0 |
| `radix-ui`                    | 1.4.3    | Consolidated shadcn import target    |
| `lucide-react`                | 1.11.0   | Yes, lucide-react genuinely bumped to v1 |
| `class-variance-authority`    | 0.7.1    |
| `clsx`                        | 2.1.1    |
| `tailwind-merge`              | 2.6.1    |
| `next-themes`                 | 0.4.6    |
| `sonner`                      | 2.0.7    | shadcn's replacement for toast       |

Dev:

| Package                           | Version  |
| --------------------------------- | -------- |
| `tailwindcss`                     | 4.2.4    |
| `@tailwindcss/postcss`            | 4.2.4    |
| `tw-animate-css`                  | 1.4.0    |
| `postcss`                         | 8.5.12   |
| `vitest`                          | 3.2.4    |
| `@vitejs/plugin-react`            | 5.2.0    | **Pinned to ^5** — v6 has Vite 7 peer mismatch with Vitest 3 |
| `jsdom`                           | 29.1.0   |
| `@testing-library/react`          | 16.3.2   |
| `@testing-library/dom`            | 10.4.1   |
| `@testing-library/jest-dom`       | 6.9.1    |
| `@testing-library/user-event`     | 14.6.1   |
| `@playwright/test`                | 1.59.1   |
| `msw`                             | 2.13.6   |
| `msw-storybook-addon`             | 2.0.7    |
| `storybook`                       | 8.6.18   | CLAUDE.md pins major; latest 8.x     |
| `@storybook/nextjs`               | 8.6.18   |
| `@storybook/addon-essentials`     | 8.6.18   |
| `@storybook/addon-a11y`           | 8.6.18   |
| `@storybook/addon-themes`         | 8.6.18   |
| `@storybook/addon-interactions`   | 8.6.18   |
| `@storybook/blocks`               | 8.6.18   |
| `@storybook/test`                 | 8.6.18   |
| `@storybook/test-runner`          | 0.24.3   |
| `react-docgen-typescript`         | 2.4.0    |
| `vite-tsconfig-paths`             | 6.1.1    |

### `apps/api`

| Package                             | Version  |
| ----------------------------------- | -------- |
| `@nestjs/common` / `core` / `platform-express` | 11.1.19 |
| `@nestjs/cli`                       | 11.0.21  |
| `@nestjs/schematics`                | 11.1.0   |
| `@nestjs/config`                    | 4.0.4    | Independent versioning — latest is 4.x, not 11.x |
| `@prisma/client` / `prisma`         | 6.19.3   |
| `reflect-metadata`                  | 0.2.2    |
| `rxjs`                              | 7.8.2    |
| `zod`                               | 3.25.76  |
| `ts-loader`                         | 9.5.7    |
| `ts-node`                           | 10.9.2   |
| `tsconfig-paths`                    | 4.2.0    |
| `source-map-support`                | 0.5.21   |
| `@types/express`                    | 5.0.6    |
| `@types/node`                       | 20.19.39 |

### `apps/workers`

| Package        | Version  |
| -------------- | -------- |
| `bullmq`       | 5.76.2   |
| `ioredis`      | 5.10.1   |
| `zod`          | 3.25.76  |
| `tsx`          | 4.21.0   |

### `packages/*`

| Package           | Version       |
| ----------------- | ------------- |
| `@pulse/config`   | 0.0.0 (workspace) |
| `@pulse/schemas`  | 0.0.0 (workspace) — depends on `zod` 3.25.76 |
| `@pulse/types`    | 0.0.0 (workspace) — TS-only |
| `@pulse/ui`       | 0.0.0 (workspace) — peer-deps `react`/`react-dom` ^19 |

---

## Decisions and trade-offs

### Toolchain
- **pnpm + Turborepo.** Single source of dependency truth. `shamefully-hoist=true` in `.npmrc` because the Next.js / Storybook / NestJS toolchains all reach for transitive types they don't formally declare.
- **Biome instead of ESLint + Prettier.** Per CLAUDE.md. One config, one binary, one cache.
- **Storybook pinned at 8.6.18.** CLAUDE.md pins the major; 8.6.18 is the latest stable in that line. Storybook 9 is intentionally avoided here.
- **`@vitejs/plugin-react` pinned to `^5.2.0`.** v6 declares a Vite ^7 peer that aligns with Vitest 3's bundled Vite, but is otherwise unstable on this stack. v5.2 is current within the v5 line.
- **`sonner` instead of shadcn `toast`.** shadcn deprecated the original toast; sonner is the official replacement and is what `pnpm dlx shadcn add toast` now installs.
- **`radix-ui` (single package) instead of `@radix-ui/react-*` per-component.** shadcn now imports through the consolidated `radix-ui` aggregate (1.4.3); we follow suit so the generated primitives stay drop-in compatible with `pnpm dlx shadcn`.

### Configuration
- **`packages/config` exposes only tsconfig presets** (`base`, `nextjs`, `nestjs`, `node`, `react-library`). Biome lives at the repo root because Biome resolves config from `cwd`, not the package.
- **No barrel `index.ts` files.** CLAUDE.md forbids them. Each shared package uses `"./*"` exports so consumers `import { x } from "@pulse/schemas/identifier-schema"`.
- **`base.json` carries no `exclude`.** TypeScript re-resolves the path *relative to* `base.json`'s location, not the consumer's, which produced bogus paths like `../config/tsconfig/node_modules`. Each consumer keeps its own `exclude` instead.
- **Workers tsconfig is CommonJS.** ESM with explicit `.js` extensions added too much friction for a single-process worker; `tsx` for dev plus `tsc` for build is enough.

### Frontend
- **Next.js App Router, Turbopack dev (`next dev --turbopack`).** Stable in 15.x.
- **Tailwind v4 with the `@import "tailwindcss"` + `@theme` CSS-first config**, registered via `@tailwindcss/postcss` in `postcss.config.mjs`. No `tailwind.config.ts`.
- **shadcn `new-york` style on `neutral` baseColor with CSS variables.** Lucide icons. The util alias is configured to `@/lib/utils/cn` so generated components import `cn` from where the project actually keeps it.
- **`@source "../../../../packages/ui/src/**/*.{ts,tsx}"`** added to `globals.css` so Tailwind v4 picks up class names used in `@pulse/ui` even though the package isn't transpiled by Next directly.
- **`transpilePackages: ["@pulse/ui", "@pulse/schemas", "@pulse/types"]`** so Next can consume the workspace packages directly without a build step.
- **Biome CSS parser has `tailwindDirectives: true`** — without it, Biome rejects `@theme`, `@source`, `@custom-variant`, and `@apply`.

### Backend
- **NestJS 11.** Health endpoints at `GET /health` (process liveness) and `GET /health/db` (DB readiness — runs `SELECT 1`, returns 503 on failure). Splitting them lets the load balancer hit a cheap probe while we still have a deeper dependency check for ourselves.
- **`@nestjs/config` + Zod env validation.** `validateEnv` formats Zod issues with `path` + `message` so a misconfigured env causes Nest to refuse to boot loudly.
- **Prisma 6 wired as a `@Global` module.** `PrismaService extends PrismaClient` and connects in `onModuleInit` (fail-fast on a bad `DATABASE_URL`), disconnects in `onModuleDestroy`. `app.enableShutdownHooks()` wires SIGINT/SIGTERM into Nest's lifecycle so the disconnect actually fires. Single `// biome-ignore lint/style/useImportType` on the controller import — Biome flags `PrismaService` as type-only, but NestJS DI needs the runtime class for `emitDecoratorMetadata` to emit the `design:paramtypes` token.
- **Full Pulse schema applied.** `prisma/schema.prisma` (~1271 lines, ~30 tables, all enums) is the source of truth for PRD Phase 1–3. Initial migration `20260428083308_initial_schema` is committed under `prisma/migrations/`; the prior `db push` history was dropped via `migrate reset` and re-bootstrapped through `migrate dev` so we have a real migration trail going forward.

### Quality gates
- **Lefthook runs `biome check --write` on staged files** with `stage_fixed: true`, so formatter fixes are added back to the commit. Glob covers `js,jsx,ts,tsx,json,jsonc,css`.
- **commitlint** uses Conventional Commits in `commit-msg`.
- **Biome enforces `useFilenamingConvention` strict kebab-case**, with overrides for Next.js special files (`page.tsx`, `layout.tsx`, etc.), Storybook stories, NestJS dot-pattern files (`app.module.ts`, `health.controller.ts`), and config files like `next.config.ts`.

### Multi-brand readiness (from CLAUDE.md)
- `apps/api` is the canonical place to enforce `brandId` scoping via Nest guards/middleware (not yet wired — placeholder).
- `apps/workers/src/queues/post-publish.worker.ts` is typed as `Worker<PostPublishJob>` where the job carries `brandId` and `platform`, matching the BullMQ contract CLAUDE.md describes.

---

## Verification

From a clean clone, in order:

```bash
nvm use                                # Node 20
corepack enable                        # picks up pnpm@10.33.2 from packageManager
pnpm install                           # installs the workspace
pnpm typecheck                         # turbo run typecheck → 5 packages, all green
pnpm lint                              # biome check . → no errors
pnpm test                              # turbo run test → vitest in apps/web (3 tests)
pnpm build                             # turbo run build → web + api + workers
pnpm storybook                         # Storybook on http://localhost:6006
pnpm --filter web exec playwright install   # one-time browser download
pnpm test:e2e                          # Playwright smoke (requires browsers above)
```

Latest run results (this session):

```
typecheck → Tasks: 5 successful, 5 total
lint      → Checked 53 files in 26ms. No fixes applied.
test      → 1 file, 3 tests passed (apps/web/src/lib/utils/cn.test.ts)
build     → Tasks: 3 successful, 3 total (web 21s, api ~5s, workers ~2s)
```

After the Prisma wiring (apps/api only):

```
db:generate                → Generated Prisma Client v6.19.3
prisma migrate dev         → Applied 20260428083308_initial_schema (1121 lines of SQL)
typecheck (apps/api)       → 0 errors
lint (apps/api)            → 11 files clean
build (apps/api)           → dist/main.js + dist/prisma/{module,service}.js
GET /health                → 200 {"status":"ok","timestamp":"…"}
GET /health/db             → 200 {"status":"ok","db":"up","timestamp":"…"}
SIGTERM                    → exit 143 + log "[PrismaService] Prisma disconnected"
```

### What's not yet runnable

- **`apps/workers` dev** needs `REDIS_URL` (any reachable Redis).
- **`pnpm test:e2e`** needs `pnpm --filter web exec playwright install` to download Chromium.

`.env.example` files in `apps/web`, `apps/api`, `apps/workers` document the variables.

---

## Known caveats

- **`pnpm.onlyBuiltDependencies`** (root `package.json`) lists native-build packages (`@biomejs/biome`, `@prisma/client`, `prisma`, `@swc/core`, `esbuild`, `lefthook`, `msw`, `sharp`, `unrs-resolver`) so pnpm 10's `approve-builds` prompt doesn't block CI installs.
- **`apps/web/src/components/ui` is excluded from Biome filename checks** so shadcn's generator output (which sometimes uses non-kebab patterns inside the directory) doesn't fight the lint rule.
- **`apps/api/**/*.ts` filename rule is disabled** because Nest's `*.module.ts`, `*.controller.ts`, `*.service.ts` convention reads as multi-dot, which Biome's `useFilenamingConvention` flags. The dot-pattern is a stronger constraint than the lint rule, so we accept it.
- **Workers use CommonJS.** If you later need ESM (e.g. to share an ESM-only schema package), switch `module: "NodeNext"` and add `.js` extensions to relative imports.
- **`packages/ui` has no `typecheck` script** while it has no `.tsx` source. Re-add `"typecheck": "tsc --noEmit"` once the first component lands; until then `tsc` errors with TS18003.

---

## Auth & multi-brand scoping

Added 2026-04-29. Lands production-ready authentication and per-brand authorization infrastructure.

### Why Auth.js lives in `apps/web`, not `apps/api`

Auth.js v5 (`next-auth@beta`) is purpose-built for Next.js — it handles SSR session hydration, API route handlers, and middleware-based route protection natively. Placing it in the NestJS API would require reimplementing all of these integrations. The API authenticates cross-origin requests by validating the session token (stored in Postgres) sent as `Authorization: Bearer <token>`.

### Custom Prisma adapter

Our schema was designed before Auth.js integration and uses field names that differ from Auth.js's expected conventions:

| Auth.js expects    | Our schema uses        |
| ------------------ | ---------------------- |
| `User.emailVerified` | `User.emailVerifiedAt` |
| `User.image`       | `User.avatarUrl`       |
| `Account`          | `OAuthAccount`         |
| `Account.access_token` | `OAuthAccount.accessToken` |
| `Account.refresh_token` | `OAuthAccount.refreshToken` |
| `Account.expires_at` (unix seconds) | `OAuthAccount.expiresAt` (DateTime) |
| `Session.expires`  | `Session.expiresAt`    |

A custom adapter (`apps/web/src/lib/auth/prisma-adapter.ts`) maps between these conventions so we never need to rename schema fields. Auth.js's `Account.type`, `token_type`, `scope`, `id_token`, and `session_state` fields are discarded on write since our `OAuthAccount` model doesn't store them.

### Bearer token cross-origin pattern

1. User signs in via `apps/web` — Auth.js creates a `Session` row in Postgres and sets a `sessionToken` cookie.
2. The frontend sends the session token as `Authorization: Bearer <token>` to the NestJS API.
3. `SessionGuard` (`apps/api/src/auth/session.guard.ts`) validates the token against the same Postgres `sessions` table, checks expiry, and attaches the user to the request.

### Brand-scoping enforcement

`BrandScopeGuard` runs after `SessionGuard`:
1. Reads `x-brand-id` header (400 if missing).
2. Looks up the brand and verifies the authenticated user has a `WorkspaceMember` row for the brand's workspace.
3. Respects the `brandAccess` array — if non-empty, the brand ID must appear in it.
4. Attaches the brand to the request (403 if any check fails).

### Workspace bootstrap on first sign-in

On the first successful sign-in (any provider), `bootstrapWorkspace()` atomically creates:
- A `Workspace` (type: `PERSONAL`, owner: the user)
- A `WorkspaceMember` (role: `OWNER`)
- A default `Brand` within the workspace

The function is idempotent — it checks for existing `WorkspaceMember` rows and skips if any exist. Runs inside a Prisma transaction.

### Providers configured

1. **Credentials** — email + bcrypt-hashed password (12 rounds). Generic "Invalid credentials" error — never reveals whether an email exists.
2. **Google OAuth** — standard OAuth flow via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. **Resend magic link** — 15-minute token expiry, sends via Resend API. Requires the `VerificationToken` model (migration `add_verification_tokens` applied).

### Encryption service

AES-256-GCM encryption (`apps/api/src/encryption/encryption.service.ts`) for encrypting OAuth tokens at rest in `connected_accounts`. Key sourced from `ENCRYPTION_KEY` env var (64 hex chars = 32 bytes). Format: `base64(iv || ciphertext || authTag)`.

### New environment variables

**`apps/api`**: `AUTH_SECRET` (min 32 chars), `ENCRYPTION_KEY` (64 hex chars)
**`apps/web`**: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `DATABASE_URL`

---

## tRPC end-to-end

Added 2026-04-29. Lands a fully-typed RPC layer between `apps/web` and `apps/api`. Single router lives in `apps/api`, exposed at `POST /trpc/*path`. The `AppRouter` type crosses the workspace boundary via a type-only package; no runtime dependency between the apps.

### Architecture

```
browser ──(same-origin)──▶ apps/web /api/trpc/[trpc]/route.ts
                                           │
                              attaches Authorization: Bearer <session-cookie>
                                           ▼
                                apps/api  /trpc/*path  (TrpcController)
                                           │
                              fetchRequestHandler → createTrpcContext
                                           ▼
                       { user, brand, brandIdHeader, prisma } → procedures
```

The browser never holds a bearer token. The Auth.js session cookie stays HTTP-only; `apps/web`'s server-side proxy reads it, validates with `auth()`, then mints `Authorization: Bearer <cookieValue>` for the upstream call. apps/api looks the cookie value up against the `Session` table — same flow as the existing REST guards.

### Why `@pulse/api-types` instead of importing `apps/api` directly

A new type-only package at `packages/api-types/` re-exports the `AppRouter` inferred type from `apps/api/src/trpc/app-router.ts`:

```ts
// packages/api-types/src/app-router-type.ts
export type { AppRouter } from "../../../apps/api/src/trpc/app-router";
```

Why a separate package:
- `apps/web` must not depend on `apps/api` at runtime — they deploy independently (Vercel + Railway).
- The relative re-export keeps the type chain inside the workspace; pnpm symlinks let TS resolve it normally. No build step, no project references, no extra tooling.
- Future routers (post, brand, oauth, …) just keep registering on the same `appRouter`; `@pulse/api-types` never changes.

**Constraint:** every file in the `AppRouter` type chain (`app-router.ts`, `trpc.ts`, `trpc-context.ts`, `routers/*.ts`, `auth/session-resolver.ts`, `auth/brand-resolver.ts`) uses **relative imports only** — no `@/...` aliases. `apps/web`'s tsconfig can't resolve apps/api's path alias, so any alias-import in the chain breaks `pnpm typecheck` on the web side. The controller and module are NOT in the type chain — they can use whatever imports.

The context type uses `PrismaClient` (not `PrismaService`) so the chain doesn't pull `@nestjs/common` into apps/web's resolution. `PrismaService extends PrismaClient`, so passing the NestJS-managed instance into a `PrismaClient`-typed context is sound at runtime.

### Three procedure helpers

`apps/api/src/trpc/trpc.ts` exports:

| Helper | Use when… | After-middleware ctx narrowing |
|---|---|---|
| `publicProcedure` | endpoint must be reachable without auth (sign-up, public reads) | `user: User \| null`, `brand: Brand \| null` |
| `protectedProcedure` | session required, brand irrelevant (e.g. `me`, list-my-workspaces) | `user: User`, `brand: Brand \| null` |
| `brandProcedure` | session **and** an `x-brand-id` resolved to an accessible brand | `user: User`, `brand: Brand` |

`brandProcedure` distinguishes its two failure modes:
- header missing entirely → `BAD_REQUEST` (400) — client bug, fix the request.
- header present but unresolved → `FORBIDDEN` (403) — security boundary, the user doesn't own that brand.

The middleware narrows by spreading the now-non-null field into the next ctx: `next({ ctx: { ...ctx, user: ctx.user } })`. Procedures downstream see the narrowed type.

### Resolver extraction (DRY guards + tRPC)

The session-token lookup and brand-membership check used to live inline inside `SessionGuard` / `BrandScopeGuard`. They've been extracted to:
- `apps/api/src/auth/session-resolver.ts` — `resolveSession({ authHeader, prisma })` returns `User | null`.
- `apps/api/src/auth/brand-resolver.ts` — `resolveBrand({ brandIdHeader, user, prisma })` returns `Brand | null`.

Both guards now delegate (and still throw their NestJS exceptions on null). The tRPC context factory calls the same resolvers. Single source of truth for "what counts as authenticated" and "what counts as accessing this brand". Adding a third consumer (worker job claiming a brand context, etc.) reuses the same functions.

### Session-token transport

**Chosen: server-side proxy.** `apps/web/src/app/api/trpc/[trpc]/route.ts` reads the Auth.js cookie (`__Secure-authjs.session-token` first, falling back to `authjs.session-token` for HTTP/dev), calls `auth()` to verify the session is live, then forwards to `${API_URL}/trpc/...` with `Authorization: Bearer <cookieValue>`.

The session token never reaches JavaScript:
- No `/api/auth/token` endpoint.
- No localStorage / sessionStorage / cookie reads from the client.
- Browser → apps/web is same-origin (`/api/trpc`); `httpBatchLink.url` doesn't even need `NEXT_PUBLIC_API_URL`.

Trade-off: every tRPC call hops through Next's serverless layer. Fine for now (one hop, low latency, no cold-start concerns on Vercel for route handlers). If we later need direct browser → apps/api for streaming or perf, we can layer a second transport without changing the procedures.

A new server-only env `API_URL` lives in `apps/web/.env.example`. `NEXT_PUBLIC_API_URL` stays available for direct dev tooling.

### How to add a new feature router

1. Create `apps/api/src/trpc/routers/<feature>-router.ts`. Use `protectedProcedure` or `brandProcedure`. Validate inputs with `z.object(...)`. Use only **relative imports** — no `@/...`.

   ```ts
   import { z } from "zod";
   import { brandProcedure, router } from "../trpc";

   export const postRouter = router({
     create: brandProcedure
       .input(z.object({ caption: z.string().min(1).max(2200) }))
       .mutation(async ({ ctx, input }) => {
         return ctx.prisma.post.create({
           data: { caption: input.caption, brandId: ctx.brand.id, authorId: ctx.user.id },
         });
       }),
   });
   ```

2. Register it in `apps/api/src/trpc/app-router.ts`:

   ```ts
   import { postRouter } from "./routers/post-router";
   export const appRouter = router({ health: healthRouter, post: postRouter });
   ```

3. Use it from any client component — fully typed, autocomplete, Zod errors surface as `error.data.zodError`:

   ```tsx
   const create = trpc.post.create.useMutation();
   create.mutate({ caption: "hello" });
   ```

No client codegen, no schema sync, no extra build step. The `AppRouter` type re-export updates automatically.

### Smoke test

`/app/dev/trpc-smoke` (gated by the existing `/app/*` middleware) renders `<TrpcSmoke />` with both procedures wired. The page is a Server Component that bootstraps `activeBrandId` from the user's first brand via Prisma; the client component sets the Zustand `useBrandStore` on mount.

### Verification (from this session)

| Check | Result |
|---|---|
| `pnpm typecheck` (8 packages incl. `@pulse/api-types`) | ✅ all green |
| `pnpm lint` | ✅ 97 files clean |
| `pnpm test` | ✅ 18 tests pass (15 api + 3 web) |
| `pnpm build` | ✅ all 3 apps; new routes `/api/trpc/[trpc]`, `/app/dev/trpc-smoke` registered |
| API direct: `/trpc/health.me` valid Bearer | ✅ 200 `{ id, email }` |
| API direct: `/trpc/health.brand` valid Bearer + brand | ✅ 200 `{ id, name }` |
| API direct: `/trpc/health.brand` valid Bearer, missing `x-brand-id` | ✅ `BAD_REQUEST` (400) |
| API direct: `/trpc/health.brand` valid Bearer, bogus `x-brand-id` | ✅ `FORBIDDEN` (403) |
| Web proxy: `/api/trpc/health.me` no cookie | ✅ 401 `{"error":"Unauthenticated"}` |
| Web proxy: `/api/trpc/health.me` with cookie | ✅ 200, identity payload |
| Web proxy: `/api/trpc/health.brand` with cookie + brand | ✅ 200, brand payload |
| Web proxy: `/api/trpc/health.brand` with cookie, no brand | ✅ tRPC `BAD_REQUEST` |
| Web proxy: `/api/trpc/health.brand` with cookie + bogus brand | ✅ tRPC `FORBIDDEN` |

Browser-flow check (sign in → `/app/dev/trpc-smoke` → see both queries succeed → spoof the store with a foreign brand id and confirm `FORBIDDEN`) is best done manually in a real browser; the curl-via-cookie matrix above already exercises every path the React Query client would take.
