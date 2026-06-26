# Portfolio & Showcase Kit

Everything needed to present AccessAudit Pro in a portfolio, case study, or
acquisition deck. Screenshots are the only asset that requires the app running
(it renders live data from Postgres); the routes, captions, and feature
highlights below make capturing them a 10-minute task.

## 1. Capture setup (one time)

```bash
supabase start && supabase db reset      # demo workspace + seeded scans
pnpm dev                                  # http://localhost:3000
# Optional, for a real report screenshot: run the worker (see apps/worker/README.md)
```

Demo login: `demo@accessaudit.pro` / `Password123!`

Capture at **1440×900** (desktop) and **390×844** (mobile, iPhone-class) in both
light and dark themes. Use the browser's device toolbar; the theme toggle lives in
the sidebar footer (desktop) and the mobile top bar.

## 2. Shot list

| # | Route | Theme | Caption |
|---|---|---|---|
| 1 | `/` | dark | "On-demand WCAG 2.2 audits & white-label reports for agencies." |
| 2 | `/dashboard` | light | "Executive dashboard — score trend, severity mix, usage meters." |
| 3 | `/scans/<id>` | light | "Client-ready report: 0–100 score, impact & WCAG breakdowns, fix guidance." |
| 4 | `/scans/<id>/print` | light | "White-label PDF deliverable — always renders as a clean light document." |
| 5 | `/clients` & `/projects` | light | "Multi-tenant workspaces, isolated by Postgres RLS." |
| 6 | `/scans/new` | dark | "Single page or URL list, WCAG A/AA/AAA, off-request-path scanning." |
| 7 | `/settings/billing` | light | "Stripe Checkout + Portal, server-enforced plan limits, live usage." |
| 8 | `/pricing` | dark | "Transparent plans with a full feature-comparison table." |
| 9 | `/dashboard` (390px) | dark | "Fully responsive — off-canvas nav drawer on mobile." |
| 10 | `/sample` | light | "Public live sample report — see the deliverable before signup." |

Save to `docs/screenshots/` as `NN-name-theme.png`. Reference the hero shots from
the README once captured.

## 3. Feature highlights (one-liners for a deck)

- **Real rendering, real findings** — Playwright drives a full Chromium DOM and
  runs axe-core, so SPA/JS content is audited, not just static HTML.
- **A score you can defend** — bounded 0–100 with exponential severity decay,
  per-page normalized, stays differentiated across the whole range.
- **The deliverable is the product** — branded PDF, CSV, and revocable public
  share links; the report leads with impact and ends with an honest
  "manual checks still recommended" section.
- **Tenant isolation by construction** — every row is gated by Postgres
  Row-Level Security, not application `where` clauses.
- **Billing that can't be gamed** — plan limits enforced server-side on every
  scan, with an idempotent Stripe webhook and graceful downgrade on cancel.
- **Accessible itself** — the product dogfoods WCAG 2.2 AA: keyboard paths,
  focus rings, landmarks, semantic HTML, contrast tokens, reduced-motion support.
- **Premium, consistent UI** — a token-driven design system, polished light/dark
  mode, skeletons, empty/error/success states, and subtle Framer Motion.

## 4. One-line pitch

> AccessAudit Pro turns any URL into a prioritized, WCAG-mapped, client-ready
> accessibility report — the agency-shaped middle ground between developer-only
> scanners and enterprise-priced platforms.
