# Pulse — Claude Code Project Memory

Pulse is a multi-tenant social media management platform that lets users manage 7 social platforms (Instagram, Twitter/X, Facebook, LinkedIn, Threads, TikTok, YouTube) from one dashboard. It supports multiple brands per user with per-brand OAuth tokens.

For deeper context, reference these on demand — do not load by default:
- `@docs/prd.md` — full product requirements
- `@docs/api-access-guide.md` — platform OAuth and API setup
- `@docs/design-spec.md` — design tokens, components, screens
- `@docs/tech-stack.md` — full stack rationale

---

## Tech Stack

**Frontend** — Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · Lucide icons · Zustand (client state) · TanStack Query v5 (server state) · React Hook Form + Zod · tRPC v11 · Tiptap (composer) · @dnd-kit (calendar) · Recharts · date-fns v3 · Motion · Storybook 8

**Backend** — NestJS · Prisma · PostgreSQL · Redis · BullMQ (scheduled posts) · Auth.js · Cloudflare R2

**Tooling** — Turborepo monorepo · Biome (lint + format, replaces ESLint/Prettier) · Vitest · Playwright · MSW

---

## Repo Structure

```
pulse/
├── apps/
│   ├── web/         # Next.js 15 frontend
│   ├── api/         # NestJS backend
│   └── workers/     # BullMQ background workers (scheduled posts, token refresh)
├── packages/
│   ├── ui/          # Shared component library
│   ├── schemas/     # Shared Zod schemas (frontend + backend)
│   ├── types/       # Shared TypeScript types
│   └── config/      # Shared tsconfig, biome config
└── docs/            # Project documentation
```

---

## Coding Conventions

### Naming
- **Files and folders: kebab-case** — `brand-switcher.tsx`, `use-brands.ts`, `post-schema.ts`
- **Components: PascalCase** inside the file — `export function BrandSwitcher()`
- **Functions and variables: camelCase**
- **Constants: UPPER_SNAKE_CASE**
- **Hooks files: `use-` prefix** — `use-current-brand.ts`
- **Store files: `-store` suffix** — `brand-store.ts`
- **Schema files: `-schema` suffix** — `post-schema.ts`
- **Type files: `-types` suffix** — `brand-types.ts`

### TypeScript
- Strict mode always. No `any` — use `unknown` and narrow.
- Prefer `type` over `interface` unless extending or merging.
- Co-locate types with the feature unless they are shared (then in `packages/types`).
- Zod schemas are the source of truth — derive types via `z.infer<typeof Schema>`.

### React
- Server Components by default. Mark client components with `"use client"` only when needed (state, effects, browser APIs).
- One component per file. File name matches component name in kebab-case.
- Props type lives in the same file, named `{ComponentName}Props`.
- Avoid prop drilling beyond 2 levels — lift to Zustand or context.
- No default exports for components — use named exports.

### Styling
- Tailwind utility classes only. No CSS modules, no styled-components.
- Use `cn()` helper from `@/lib/utils/cn` for conditional classes.
- Design tokens live in `tailwind.config.ts` — never use raw hex values in JSX.
- Platform colors are accents only. Never use them as large fills.

### State Management
- **Server state → TanStack Query.** Never put fetched data in Zustand.
- **Client UI state → Zustand.** One store per feature domain.
- **Form state → React Hook Form.** Validate with Zod via `@hookform/resolvers`.

### Imports
Use path aliases — never relative imports across feature boundaries.
```ts
import { BrandSwitcher } from "@/components/brand/brand-switcher";
import { useBrands } from "@/lib/hooks/use-brands";
import type { Brand } from "@/types/brand-types";
```

---

## Multi-Brand Architecture (Critical)

Pulse is multi-tenant by design. **Every backend operation must be scoped to a brand.**

- Every API route requires a `brandId` in the request context.
- Every database query that touches brand-owned data must filter by `brandId`.
- OAuth tokens are stored per-brand in `connected_accounts`, never globally.
- Never mix tokens or data across brands. Treat brand isolation as a security boundary.
- The frontend uses `useBrandStore()` to track the active brand and includes its ID in all API calls.

---

## OAuth & Platform Integration

- One Pulse-level developer credential per platform (stored in env vars).
- Each brand obtains its own access token via OAuth — stored encrypted in `connected_accounts`.
- All access tokens must be encrypted at rest using a server-side encryption key.
- Build a platform abstraction layer: `BasePlatformAdapter` interface with `publish()`, `fetchAnalytics()`, `refreshToken()` methods. Each platform implements it.
- Token refresh runs as a BullMQ job every hour for tokens expiring within 24h.
- Failed token refresh → mark `connected_accounts.status = 'expired'` and surface to user in UI.

---

## Storybook

- Every component in `components/` has a `.stories.tsx` file in `stories/`.
- Stories include all states: default, hover, loading, error, empty.
- Use MSW for API mocks in stories — never call real APIs.
- Stories tagged `autodocs` for automatic documentation generation.
- Stories organized by feature domain (Brand, Composer, Calendar, Inbox), not component type.

---

## Testing

- **Unit tests** (Vitest) — for utils, hooks, schemas. Co-locate as `{name}.test.ts`.
- **Component tests** (Storybook test runner) — interactions tested in stories.
- **E2E tests** (Playwright) — critical user flows in `apps/web/e2e/`.
- Always test the unhappy path (errors, empty states, validation failures).
- Don't test implementation details — test behavior visible to the user.

---

## Background Jobs (BullMQ)

All async work runs through BullMQ workers — never run heavy work in API request handlers.

Required queues:
- `post-publish` — scheduled post publishing
- `token-refresh` — proactive OAuth token refresh
- `analytics-sync` — daily analytics fetch per brand
- `inbox-sync` — incoming messages and mentions

Every job must:
- Be idempotent — safe to retry
- Have explicit retry/backoff configuration
- Log start, success, and failure to the `job_logs` table
- Surface errors to Sentry with the `brandId` and `platform` as tags

---

## Things to Avoid

- ❌ **Do not use `any`** — use `unknown` or proper types
- ❌ **Do not use ESLint or Prettier** — Biome handles both
- ❌ **Do not use camelCase for filenames** — always kebab-case
- ❌ **Do not import from `index.ts` barrel files** — direct imports only (faster, better tree-shaking)
- ❌ **Do not create global tokens** — every token belongs to a specific brand
- ❌ **Do not run platform API calls from request handlers** — queue them via BullMQ
- ❌ **Do not store secrets in code or `.env` files in git** — use Doppler
- ❌ **Do not write excessive comments** — code should be self-documenting; comments explain WHY, not WHAT
- ❌ **Do not use moment.js** — use date-fns
- ❌ **Do not bypass Zod validation** — every API input is validated
- ❌ **Do not use raw SQL** — use Prisma; if a query is too complex for Prisma, document why

---

## Commands

```bash
# Dev
pnpm dev                  # Run all apps in dev mode (Turborepo)
pnpm dev --filter=web     # Run just the frontend
pnpm storybook            # Run Storybook

# Build
pnpm build                # Build all apps
pnpm typecheck            # Type-check all packages

# Quality
pnpm lint                 # Run Biome lint
pnpm format               # Run Biome format
pnpm test                 # Run all tests
pnpm test:e2e             # Run Playwright tests

# Database
pnpm db:migrate           # Run Prisma migrations
pnpm db:studio            # Open Prisma Studio
pnpm db:seed              # Seed dev data
```

---

## Workflow Expectations

- Before writing code, check if a similar component or utility exists. Reuse over rebuild.
- For non-trivial features, propose the approach in plan form before implementing.
- Always show the diff and explain trade-offs after major changes.
- When unsure about product behavior, reference `@docs/prd.md` rather than guessing.
- Use checkboxes `[ ]` in markdown when tracking multi-step work — Claude can check them off as it goes.
- Commit messages follow Conventional Commits: `feat(composer): add platform preview`.

---

## Definition of Done

A feature is done when:
1. ✅ TypeScript compiles with no errors (`pnpm typecheck`)
2. ✅ Biome passes (`pnpm lint`)
3. ✅ All tests pass (`pnpm test`)
4. ✅ Storybook stories cover all states
5. ✅ Works in both light and dark mode
6. ✅ Keyboard accessible
7. ✅ Mobile responsive
8. ✅ Multi-brand scoping verified (where applicable)