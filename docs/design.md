# Pulse — Design System

> The single source of truth for what Pulse looks like and how it behaves.
> This file is read by **claude.ai/design** during onboarding and by **Claude Code** at build time.
> When in doubt, this document wins over any individual screen or component.

> Last reviewed: 2026-05-13

---

## 1. Identity

Pulse is a multi-tenant social media management platform. Users are creators, marketers, small-team brand managers, and (Phase 3) agencies. The product handles seven platforms — Instagram, Twitter/X, Facebook, LinkedIn, Threads, TikTok, YouTube — through a single composer, calendar, inbox, and analytics surface.

**Voice in UI copy:** Direct, calm, never cute. Don't apologize for the product. Don't use exclamation marks except in success toasts. Empty states explain *what to do*, not *that there's nothing here*.

**Visual posture:** Soft, warm, professional. Pastel violet brand grounded in a near-white background. Generous whitespace. Real data is dense; chrome is quiet. The opposite of a SaaS dashboard from 2018 — no royal blue, no hard shadows, no aggressive iconography.

**One word that should describe every Pulse screen:** *settled*.

---

## 2. Color

### 2.1 Color philosophy

All colors are **OKLCH**. Reasons: perceptual uniformity (a 0.1 lightness step looks the same at L=0.4 as at L=0.8), wider gamut for the brand violet, and predictable dark-mode inversions. Never use HSL, RGB, or hex *in code* — they exist only inside `globals.css` to define tokens. Never use raw OKLCH in JSX either; reference tokens.

### 2.2 Token surface

Three independent layers:

1. **Brand scale** (`--brand-50` → `--brand-800`) — the violet that *is* Pulse
2. **Semantic tokens** (`--background`, `--primary`, `--muted`, etc.) — light and dark mode aware, used by shadcn primitives
3. **Platform tokens** (`--platform-instagram`, etc.) — accent colors representing third-party brands

These are independent. **Never use brand tokens for semantic purposes** (don't use `brand-500` as a destructive color), and never use platform tokens as large fills.

### 2.3 Brand scale (violet pastel)

| Token         | OKLCH                | Approx hex | Use                                  |
|---------------|----------------------|-----------:|--------------------------------------|
| `--brand-50`  | `oklch(0.97 0.04 275)` | `#f4f1fa` | Page-level brand tint, hover fills   |
| `--brand-100` | `oklch(0.94 0.07 275)` | `#e8e1f5` | Subtle backgrounds, badge fills      |
| `--brand-200` | `oklch(0.89 0.10 275)` | `#d8c9ee` | Avatar fallback bg, chip backgrounds |
| `--brand-300` | `oklch(0.82 0.13 275)` | `#bea5e0` | Decorative borders                   |
| `--brand-400` | `oklch(0.74 0.16 275)` | `#a481d4` | Focus rings, primary CTA on dark     |
| `--brand-500` | `oklch(0.62 0.20 275)` | `#7c4dc1` | Primary CTA on light, links          |
| `--brand-600` | `oklch(0.52 0.22 275)` | `#5e34a0` | Active state, pressed CTA            |
| `--brand-700` | `oklch(0.42 0.20 275)` | `#452977` | Avatar fallback text, emphatic copy  |
| `--brand-800` | `oklch(0.32 0.17 275)` | `#2c1d57` | High-emphasis text on light surfaces |

### 2.4 Semantic tokens (drive shadcn)

Light mode is the default. Dark mode is a class-based variant (`.dark`).

| Token                   | Maps to (light)      | Use                              |
|-------------------------|----------------------|----------------------------------|
| `--background`          | near-white violet    | Page background                  |
| `--foreground`          | near-black violet    | Body text                        |
| `--card` / `-foreground`| white / fg           | Card surface                     |
| `--popover` / `-fg`     | white / fg           | Dropdowns, popovers, tooltips    |
| `--primary` / `-fg`     | brand-200 / brand-700| Primary buttons (pastel fill)    |
| `--secondary` / `-fg`   | brand-50 / brand-700 | Secondary buttons, chip surfaces |
| `--muted` / `-fg`       | brand-50 / mid-violet| Disabled, captions, secondary    |
| `--accent` / `-fg`      | brand-100 / brand-700| Hover, focus highlight           |
| `--destructive`         | red oklch            | Errors, destructive actions      |
| `--border`              | brand-100 muted      | All hairline borders             |
| `--input`               | same as border       | Form input borders               |
| `--ring`                | brand-400            | Focus rings                      |

**Rule:** any color in JSX must come from one of these three layers via Tailwind classes (`bg-card`, `text-muted-foreground`, `border-border`, `bg-brand-100`, `text-platform-instagram`). No exceptions.

### 2.5 Platform tokens

| Platform   | Token                      |
|------------|----------------------------|
| Instagram  | `--platform-instagram`     |
| Twitter/X  | `--platform-twitter`       |
| Facebook   | `--platform-facebook`      |
| LinkedIn   | `--platform-linkedin`      |
| Threads    | `--platform-threads`       |
| TikTok     | `--platform-tiktok`        |
| YouTube    | `--platform-youtube`       |

**Strict rules for platform colors:**
- Use as **accents only**: ≤24px icons, 2px left borders, 4px dots, single-pixel hairlines under chips
- **Never** as backgrounds for blocks larger than a button
- **Never** as text color for body copy (only for icon labels or chip labels at micro size)
- The Pulse brand is violet; platform colors are guests on our screens, not hosts

### 2.6 Pastel semantic utilities

For status, not for chrome:

| Token                | Use                              |
|----------------------|----------------------------------|
| `--color-success-bg` | Success chip background          |
| `--color-success-fg` | Success chip text + icon         |
| `--color-warning-bg` | Warning chip / banner background |
| `--color-warning-fg` | Warning chip text                |
| `--color-info-bg`    | Info chip background             |
| `--color-info-fg`    | Info chip text                   |
| `--color-error-bg`   | Inline error / chip background   |
| `--color-error-fg`   | Inline error text                |

Use these only for status communication (post published, token expired, sync failed). Never for decoration.

### 2.7 Brand gradient

`--gradient-brand` (peach → pink → violet → teal) and `--gradient-brand-vertical`. Reserved for: the logo, the auth-page hero, the empty-state hero on the dashboard, and the upgrade-CTA on settings. **Never** as a button background and **never** behind body text.

---

## 3. Typography

### 3.1 Families

- **Sans:** Geist (`--font-geist-sans`). All UI text, headings, body, button labels.
- **Mono:** Geist Mono (`--font-geist-mono`). Code blocks, IDs, API responses in dev/admin views.

No third family. The logo wordmark uses Geist 700, not the Nunito in the source SVG — this is intentional and means there's exactly one font import for the whole app.

### 3.2 Scale

The typography scale is the most important addition for design consistency. **Add these tokens to `globals.css` inside `:root`** if not already present:

```css
:root {
  /* Typography scale */
  --text-display: 2rem;       /* 32px — auth hero, marketing one-shots */
  --text-display-lh: 1.1;
  --text-h1: 1.625rem;        /* 26px — page titles, primary stat values */
  --text-h1-lh: 1.2;
  --text-h2: 1.25rem;         /* 20px — section headers in pages */
  --text-h2-lh: 1.3;
  --text-h3: 1rem;            /* 16px — card titles, modal titles */
  --text-h3-lh: 1.4;
  --text-body: 0.875rem;      /* 14px — primary body, table cells, controls */
  --text-body-lh: 1.5;
  --text-body-sm: 0.8125rem;  /* 13px — dense content (inbox rows) */
  --text-body-sm-lh: 1.5;
  --text-caption: 0.75rem;    /* 12px — labels, meta, axis labels */
  --text-caption-lh: 1.4;
  --text-micro: 0.625rem;     /* 10px — timestamps in dense feeds, badge text */
  --text-micro-lh: 1.4;
}
```

And expose them inside `@theme inline { ... }` so Tailwind can use them as `text-display`, `text-h1`, etc.:

```css
@theme inline {
  --text-display: var(--text-display);
  --text-h1: var(--text-h1);
  --text-h2: var(--text-h2);
  --text-h3: var(--text-h3);
  --text-body: var(--text-body);
  --text-body-sm: var(--text-body-sm);
  --text-caption: var(--text-caption);
  --text-micro: var(--text-micro);
}
```

### 3.3 Usage table

| Style       | Size  | Weight | Tracking | Where                                                          |
|-------------|-------|--------|----------|----------------------------------------------------------------|
| `display`   | 32px  | 700    | -0.02em  | Auth pages, marketing                                          |
| `h1`        | 26px  | 700    | -0.01em  | `PageHeader` titles, primary stat values                       |
| `h2`        | 20px  | 600    | -0.01em  | Section headers within a page                                  |
| `h3`        | 16px  | 600    | 0        | Card titles, modal titles                                      |
| `body`      | 14px  | 400    | 0        | Primary content. Default for `<p>` and table cells             |
| `body-sm`   | 13px  | 400    | 0        | Dense rows (inbox, activity feed), secondary explanatory text  |
| `caption`   | 12px  | 500    | 0        | Field labels, stat-card labels, chart axis labels, meta lines  |
| `micro`     | 10px  | 500    | 0.01em   | Timestamps, type-pill text, hashtag count badges               |

### 3.4 Rules

- **Never use `text-[Npx]`** arbitrary sizes in JSX. If a screen needs a size not in the scale, the scale is wrong — fix the scale, don't bypass it.
- **Headings stack:** a page contains exactly one `h1` (set by `PageHeader`), zero or more `h2` section headers, and `h3` for cards. Don't skip levels.
- **Numbers:** stat-card values use `h1` (26px, 700, `tracking-tight`). The unit/delta below uses `caption`.
- **Letter spacing:** display and h1 use slightly negative tracking; micro uses slightly positive. Body and caption are 0.
- **Line height** comes paired with size — never override unless it's a single-line label.
- **Bold inside body text** uses `font-semibold` (600), not `font-bold` (700). 700 is reserved for headings and emphasis.

---

## 4. Spacing

Tailwind's default 4px-base scale is the canonical spacing system. Pulse uses these values most often — design and code should default to them:

| Token         | Value | Use                                                  |
|---------------|------:|------------------------------------------------------|
| `gap-1` / `p-1` | 4px  | Inside chips, between icon and label in micro pills |
| `gap-1.5`     | 6px   | Tight controls, button-with-icon                     |
| `gap-2`       | 8px   | Standard inline spacing                              |
| `gap-2.5`     | 10px  | Avatar + text rows, dense list items                 |
| `gap-3`       | 12px  | Card content stacks                                  |
| `gap-4`       | 16px  | Default form spacing                                 |
| `gap-5`       | 20px  | Page section spacing (between blocks on a page)      |
| `gap-6`       | 24px  | Generous form sections                               |
| `gap-7` / `p-7` | 28px | Page padding (desktop)                              |
| `gap-8`       | 32px  | Large hero spacing, marketing                        |

**Page padding is `p-7` on desktop, `p-4` on mobile.** Page header pad is `px-7 py-4` on desktop. Card pad is `p-5` (20px) for dense cards (stat cards, list rows) and `p-6` for content cards.

---

## 5. Radius

```
--radius: 0.625rem;       /* 10px base */
--radius-sm: calc(var(--radius) - 4px);  /* 6px */
--radius-md: calc(var(--radius) - 2px);  /* 8px */
--radius-lg: var(--radius);              /* 10px */
--radius-xl: calc(var(--radius) + 4px);  /* 14px */
```

| Class         | Use                                                      |
|---------------|----------------------------------------------------------|
| `rounded-xs`  | Inline checkboxes, micro pills                           |
| `rounded-sm`  | Chips, status badges                                     |
| `rounded-md`  | Buttons, inputs, dropdowns                               |
| `rounded-lg`  | Cards, modals, popovers                                  |
| `rounded-xl`  | Hero blocks, marketing surfaces                          |
| `rounded-full`| Avatars, pill buttons, dot indicators                    |

**No sharp corners anywhere.** Even cells in tables get `rounded-sm` if they're interactive.

---

## 6. Layout

### 6.1 App shell

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (256px, fixed)  │  Main column (flex-1)         │
│  ─────────────────────── │ ────────────────────────────  │
│  - Brand lockup (h-14)   │ PageHeader (h-14, sticky)     │
│  - Brand switcher        │ ─────────────────────────────  │
│  - Nav items             │                                │
│  - Bottom: user menu     │ Content area (overflow-y-auto, │
│                          │ p-7)                           │
└─────────────────────────────────────────────────────────┘
```

- Sidebar: width 256px (`w-64`), `bg-card`, `border-r border-border`. Stays visible at `md` and up.
- PageHeader: height 56px (`h-14`), sticky top, `bg-background/80 backdrop-blur`, `border-b border-border`. Contains page title (h1) on the left and primary action button on the right.
- Content scrolls; sidebar and header don't.

### 6.2 Breakpoints

Tailwind defaults: `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`.

Pulse is **desktop-first** (B2B SaaS). Behavior at each breakpoint:

| Breakpoint | Behavior                                                          |
|------------|-------------------------------------------------------------------|
| `< md`     | Sidebar collapses to drawer (hamburger in PageHeader). Page padding `p-4`. Stat-card grids go from 4-col to 2-col. |
| `md` – `lg`| Sidebar visible. Stat grids 2-col. Composer single column.        |
| `≥ lg`     | Full layout: sidebar + main column with multi-column composer (editor / previews) and 4-col stat grids. |

**Never design mobile-first.** Pulse's primary user is on a 13"+ laptop. Mobile is a graceful degradation, not the canonical view.

---

## 7. Components

All shadcn primitives live in `apps/web/src/components/ui/` and are **already customised** (Button has extra `xs`, `icon-xs`, `icon-sm`, `icon-lg` sizes; Avatar has `AvatarBadge` + `AvatarGroup` extensions). Use them as-is. Don't reinstall fresh shadcn — that overwrites the customisations.

### 7.1 Button hierarchy

| Variant      | Visual                              | Use                                       |
|--------------|-------------------------------------|-------------------------------------------|
| `default`    | `bg-primary` pastel violet fill     | Primary action. **One per visible area**  |
| `outline`    | Border, transparent fill            | Secondary actions                         |
| `secondary`  | `bg-secondary` pale violet fill     | Tertiary, often grouped with outline      |
| `ghost`      | No fill, hover only                 | Toolbar buttons, icon-only nav            |
| `destructive`| `bg-destructive`                    | Delete, disconnect, irreversible only     |
| `link`       | `text-primary` underline-on-hover   | Inline text links inside body copy        |

**Rule:** at most one `default` button per visible page section. If a screen needs two equally-weighted CTAs, one becomes `outline`.

### 7.2 Sizes

`xs` (h-6) for inline-with-text actions · `sm` (h-8) for compact toolbars · `default` (h-9) for forms and most CTAs · `lg` (h-10) for auth-page submit buttons. Icon-only buttons use the corresponding `icon-*` sizes — never put just an icon inside a `default` size button.

### 7.3 Card

`bg-card border border-border rounded-lg`. Padding:
- `p-5` (20px) for dense cards: stat cards, post rows, inbox items
- `p-6` (24px) for content cards: forms, settings sections
- `p-0` and child padding only when the card contains a list with internal dividers

### 7.4 Input

`h-9 rounded-md border border-input`. Always paired with a `<Label>` above it. Never use placeholder text as the label — placeholders are example values, not field names. Required fields are *not* visually marked; instead, mark optional fields with `(optional)` in the label. This keeps the default state clean and reduces visual noise.

### 7.5 Avatar

| Size        | Class       | Use                                  |
|-------------|-------------|--------------------------------------|
| `sm` (24px) | `data-size=sm` | Comment author avatars in feeds   |
| `default` (32px) | (default) | Inbox rows, activity feed         |
| `lg` (40px) | `data-size=lg` | User profile, settings page       |

Always include `<AvatarFallback>` with two-letter initials. Background `bg-brand-200`, text `text-brand-700`. **Never set this with inline `style={{ background: 'oklch(...)' }}`** — that's the existing anti-pattern in `activity-feed.tsx` and `activity/page.tsx` that needs cleanup.

### 7.6 Platform icon

Use `<PlatformIcon platform={platform} size={N} />` from `@pulse/ui/icons/platform-icon`. Default size `16`. **Never** import a generic icon library and color it with platform tokens — go through `PlatformIcon`. This guarantees consistent rendering and accessibility labels.

---

## 8. Patterns

### 8.1 Empty state

Centered block, vertical padding `py-15` (60px), max-width `max-w-md`:

```
[Icon — 32px, muted, lucide]
        ↓ (gap-4)
[Title — h3, foreground]
        ↓ (gap-2)
[Description — body, muted-foreground, max 2 lines]
        ↓ (gap-4)
[Primary CTA — what to do next]
```

The description never says "nothing here yet." It says **what action would change that**: "Connect a social account to start scheduling posts."

### 8.2 Loading state

- **Skeleton:** `bg-muted animate-pulse rounded-md` matching the size of the eventual content. Skeletons mirror layout, not just "a generic gray block."
- **Inline spinner:** `<Loader2 className="size-4 animate-spin" />` from lucide for in-button loading
- **Page-level:** show skeletons of the actual layout, never a centered spinner alone

Build these as shared primitives in `apps/web/src/components/ui/` — `<Skeleton>` and `<LoadingSpinner>`.

### 8.3 Error state

| Location        | Treatment                                                       |
|-----------------|-----------------------------------------------------------------|
| Inline (form)   | `bg-destructive/10 text-destructive rounded-md p-3 text-body`   |
| Toast           | `sonner` toast with `type: 'error'`, 5s auto-dismiss            |
| Page-level      | Dedicated `<ErrorState>` component: icon, h2 title, body, retry |

Inline errors appear directly under the input, in `text-caption text-destructive`, never as a tooltip.

### 8.4 Forms

- React Hook Form + Zod, always
- Errors live below the input; submitted state shows summary at the top of the form if multiple errors
- Submit button is full-width on auth pages (`w-full`), default-width elsewhere
- `aria-invalid` set automatically when a field has a Zod error → triggers the destructive ring on the input

### 8.5 Toasts

- `sonner` with the position `top-right`
- 4s auto-dismiss for success/info, 5s for warning, 6s for error (with action button)
- **Never** use a toast for a permanent error — show inline instead
- Max one toast visible at a time; new ones replace

### 8.6 Status chips

`rounded-full px-1.5 py-0.5 text-micro font-medium inline-flex items-center gap-1`. Color from the pastel utility tokens (success/warning/info/error). Always include both an icon AND text — color is never the sole indicator.

---

## 9. Motion

- **Respect `prefers-reduced-motion`.** All non-essential animation disabled when set.
- **Modals/dialogs:** fade + zoom-95 → 100 in 200ms on open, 150ms on close (matches shadcn defaults — don't override)
- **Hover transitions:** 150ms `ease-out` on `bg`, `border`, `color` only. Don't transition `transform` on hover (causes layout jank).
- **Page transitions:** none. App Router navigations are instant by design.
- **Skeletons:** `animate-pulse` (1.5s loop, built into Tailwind)
- **Drag-drop (calendar):** snap-to-cell on release, no rotation, no scale. Use `@dnd-kit` defaults.

**Never animate:** font size, font weight, layout (grid template, flex direction). These cause reflow and feel cheap.

---

## 10. Accessibility

- **Contrast:** WCAG AA minimum (4.5:1 body, 3:1 large text). When in doubt, run a contrast check against `--foreground` on `--background` and `--primary-foreground` on `--primary`.
- **Focus:** every interactive element shows `ring-3 ring-ring/50` on `:focus-visible`. Never remove the focus ring.
- **Keyboard:** every interactive thing reachable by Tab in document order. Modals trap focus. Escape closes modals/popovers/menus.
- **Hit targets:** minimum 32px (`size-8`) for any tappable element. Icon buttons should be `icon-sm` or larger.
- **Screen readers:** every icon-only button has an `<span class="sr-only">`. Every form input has a real `<label>` (not `aria-label`).
- **Color is never the sole carrier of information.** Status uses color + icon + text. Required form fields are indicated in the label, not by color.

---

## 11. Anti-patterns (do not do these)

- ❌ **Raw hex or OKLCH in JSX.** `style={{ background: "oklch(0.90 0.05 275)" }}` is the existing leak in `activity-feed.tsx` and `activity/page.tsx`. Replace with `bg-brand-200` / `text-brand-700`. Same rule for hex.
- ❌ **Arbitrary text sizes** like `text-[26px]` or `text-[10px]`. Use `text-h1`, `text-micro`. If the size you want isn't in the scale, the scale needs updating — discuss before adding.
- ❌ **Platform colors as fills** larger than a small icon or 2px border. Pulse owns the violet; platforms are accents.
- ❌ **Two primary buttons** in the same page section. If you have two equally-weighted actions, one becomes `outline`.
- ❌ **Placeholder as label.** Always use a real `<Label>`.
- ❌ **Toast for non-transient information.** A toast that says "you have no connected accounts" is wrong — that's an empty state.
- ❌ **`font-bold` (700) inside body text.** Use `font-semibold` (600) for emphasis. 700 is for headings.
- ❌ **Sharp corners.** `rounded-none` is never used on Pulse surfaces.
- ❌ **Hard shadows.** Pulse uses `shadow-xs` and `shadow-sm` only. No `shadow-lg`/`shadow-xl` on regular UI (modals are the exception, and `shadow-lg` on them is from shadcn defaults).
- ❌ **Mobile-first design.** Desktop is canonical. Mobile is the responsive degradation.
- ❌ **Reinstalling shadcn primitives.** They've been customised. Edit in place.

---

## 12. Notes for claude.ai/design

When generating new screens for Pulse:

1. **Target the existing shadcn primitives** in `apps/web/src/components/ui`. If a primitive exists, use it; do not generate a custom equivalent.
2. **Use semantic and brand tokens** for all color references. Tailwind classes like `bg-card`, `text-muted-foreground`, `border-border`, `bg-brand-100`, `text-platform-instagram`. Never inline OKLCH.
3. **Use the typography scale** (`text-h1`, `text-body`, `text-caption`, etc.). Never use `text-[Npx]`.
4. **Layout pattern:** every `/app/*` page is rendered inside the app shell. Pages start with a `<PageHeader title="..." />` and have content in a `flex flex-1 flex-col gap-5 overflow-y-auto p-7` wrapper.
5. **Empty / loading / error states** are required for every screen that fetches data. Use the patterns in §8.
6. **Mobile responsive but desktop-first.** Design for `≥ lg` viewports; breakpoint-down to `md` and `< md` as graceful degradations.
7. **Multi-brand scoping is invisible to the design** — assume the active brand is set. Don't design brand-switcher UI per-screen; it lives in the sidebar.
8. **Do not use** brand colors as semantic indicators (success/error), platform colors as page backgrounds, or the brand gradient as a button background.

When in doubt about a screen, mirror the patterns in `apps/web/src/app/app/page.tsx` (the dashboard) — that file is the canonical example of Pulse layout.

---

## 13. Notes for Claude Code

When implementing screens or components:

1. **Check `apps/web/src/components/ui/` before generating** — primitive may already exist
2. **All new components live in** `apps/web/src/components/{feature}/`. Lift to `packages/ui` only if shared across `apps/web`, `apps/api` (rare), or a future `apps/marketing`.
3. **Files are kebab-case**, components are PascalCase inside, no default exports
4. **Stories required** for everything in `components/ui` and `components/{feature}` — see `apps/web/stories/`
5. **Definition of Done** (per CLAUDE.md):
   - Typecheck passes
   - Biome lints clean
   - Vitest tests pass
   - Storybook stories cover default + hover + loading + error + empty states
   - Works in light + dark mode
   - Keyboard accessible
   - Responsive at `md` breakpoint
   - Multi-brand scoping verified where applicable

---

## 14. Open questions / known gaps

These should be resolved over the next few weeks but are not blocking:

- [ ] **Contrast verification** — `--primary` (oklch 0.88) on `--background` (oklch 0.99) inverts the usual light-bg/dark-text pattern. Probably passes AA but should be measured.
- [ ] **Mobile breakpoints in practice** — design hasn't been pressure-tested below `md` yet. May reveal layout issues we haven't seen.
- [ ] **Skeleton primitives** — `<Skeleton>`, `<EmptyState>`, `<ErrorState>` not yet built in `components/ui`. §8 specifies the patterns; the components themselves are TODO.
- [ ] **Inline OKLCH cleanup** — `activity-feed.tsx` and `app/activity/page.tsx` use raw OKLCH in `style={{ ... }}`. Replace with `bg-brand-200` / `text-brand-700`.
- [ ] **Storybook coverage** — currently only `Button` has stories. Backfill the other primitives.
- [ ] **Motion library decision** — `tw-animate-css` is wired; `motion` is installed but unused. Pick one and remove the other.

---

*End of DESIGN.md*

---

## Reconciliation note (2026-05-13)

Audited §14 "Open questions / known gaps" against `main` codebase. All 6 items verified as still open — no marks changed:

- **Contrast verification** — still unverified. `[ ]` unchanged.
- **Mobile breakpoints** — still unpressure-tested. `[ ]` unchanged.
- **Skeleton / EmptyState / ErrorState primitives** — confirmed not built in `components/ui/`. `[ ]` unchanged.
- **Inline OKLCH cleanup** — confirmed still present in `activity-feed.tsx` and `app/activity/page.tsx`. `[ ]` unchanged.
- **Storybook coverage** — confirmed: only `button.stories.tsx` exists (1 file). `[ ]` unchanged.
- **Motion library decision** — `tw-animate-css` wired, `motion` installed but unused. `[ ]` unchanged.

Only change: "Last reviewed" bumped to 2026-05-13.