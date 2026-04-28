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
│   │   ├── nest-cli.json
│   │   ├── prisma/schema.prisma # User + Brand placeholder
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── config/env-schema.ts # Zod validateEnv
│   │   │   ├── health/{health.controller.ts, health.module.ts}
│   │   │   └── main.ts
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
- **NestJS 11.** Latest. Health endpoint at `GET /health`.
- **`@nestjs/config` + Zod env validation.** `validateEnv` formats Zod issues with `path` + `message` so a misconfigured env causes Nest to refuse to boot loudly.
- **Prisma 6 placeholder schema.** `User` and `Brand` only — enough to verify `prisma generate` once `DATABASE_URL` is set. Per CLAUDE.md, Brand carries `ownerId` with an `@@index` and the table is `@@map("brands")`.

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

### What's not yet runnable

- **`apps/api` dev** needs `DATABASE_URL` (any reachable Postgres) and `prisma migrate dev` once.
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
