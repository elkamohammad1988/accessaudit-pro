# AccessAudit Pro — Release & Migration Playbook

How a change goes from PR to production safely, and how database migrations stay
non-breaking. Pairs with [`RUNBOOKS.md`](RUNBOOKS.md) and
[`DISASTER_RECOVERY.md`](DISASTER_RECOVERY.md).

## Environments

| Env | Purpose | Database |
|---|---|---|
| **Preview** | Per-PR deploy (Vercel) for review/QA | a shared preview Supabase, or a `supabase` branch |
| **Staging** | Pre-prod mirror; run E2E + manual smoke | dedicated staging Supabase project |
| **Production** | Live | production Supabase project (PITR on) |

Preview deployments are automatic per PR. Promote PR → staging → production; never
push experimental migrations straight to production.

## CI workflows

| Workflow | Triggers | Gates |
|---|---|---|
| `ci.yml` (**quality**) | push to main, **every PR** | typecheck · lint · unit tests · i18n parity · production build |
| `security.yml` | push to main, **every PR** | `pnpm audit --prod --audit-level critical` (fails on critical; high/moderate reported) · gitleaks secret scan (`.gitleaks.toml` allowlist) |
| `codeql.yml` | push/PR + weekly | CodeQL SAST (`security-extended`) |
| `e2e.yml` | **push to main + manual dispatch** | migrations apply to a fresh DB (`supabase start`) · Playwright suite against seeded Supabase |
| `dependabot.yml` | weekly | grouped npm + GitHub-Actions update PRs |

## Pre-merge gate (PR-blocking)

A PR may merge only when **`ci.yml`, `security.yml`, and `codeql.yml`** are green —
i.e. types, lint, unit tests, i18n parity, build, dependency audit (critical), secret
scan, and static analysis all pass.

**E2E and migration verification run on merge to `main`** (and on demand) rather than
per-PR: they're heavier, and the authenticated-flow selectors should be validated once
against real infra before being promoted to a PR blocker. Once validated, add `e2e.yml`
to branch protection to make it required.

> **Audit level:** the gate fails on **critical**. There is one accepted `high` —
> `rollup` reached transitively through `@sentry/nextjs`'s build-time webpack plugin;
> it never ships to runtime and has no clean override. It's reported (non-blocking) and
> tracked for removal when Sentry updates its plugin chain.

## Database migrations — expand / contract

Migrations are **forward-only**. To avoid downtime and keep rollback safe, change
schema in **expand → migrate → contract** phases across separate releases — never a
destructive change in the same release that introduces it:

1. **Expand** — add the new shape *additively* (new nullable column / new table /
   new function). The old app version still works.
2. **Backfill & dual-write** — deploy app code that writes both old and new; backfill
   existing rows.
3. **Switch** — deploy app code that reads the new shape.
4. **Contract** — in a *later* release, once nothing references the old shape, drop it.

Rules:
- Never `DROP`/`RENAME`/`NOT NULL`-tighten a column in the same release that stops
  using it — that breaks the still-running previous app version during rollout.
- No automatic down-migrations. To revert a bad migration, ship a **compensating**
  forward migration (and/or PITR-restore per DR if data is affected).
- New `SECURITY DEFINER` functions must `set search_path = public` and have explicit
  `grant`/`revoke` (see existing quota RPCs for the pattern).
- Tenant-scoped tables must have RLS enabled with owner-scoped policies before they
  hold data.

## Deploy order

Because migrations are expand-only and backward-compatible, ordering is forgiving:
1. **Apply migrations** (`supabase db push`) — additive, so the current app keeps working.
2. **Worker** — stateless; rolling restart. In-flight scans reaped & requeued.
3. **Web** — promote the new build.

## Post-deploy validation

- [ ] Run the smoke test ([`DEPLOYMENT.md`](DEPLOYMENT.md) §6): signup → onboarding →
      client → project → scan → report → share → upgrade.
- [ ] Watch Sentry error rate for 15 min (no new spike).
- [ ] Watch worker `/metrics` (`oldestQueuedAgeSeconds` stable).
- [ ] Spot-check billing: a Stripe test checkout updates the plan.

## Rollback

| Tier | Action | Data impact |
|---|---|---|
| Web | Promote previous Vercel deployment | none |
| Worker | Redeploy previous Railway image | none (scans requeue) |
| Migration | Ship compensating forward migration; PITR-restore if data damaged | per DR |

Roll back first, diagnose second (see [`RUNBOOKS.md`](RUNBOOKS.md) §5).

## Environment validation

The apps assert required env at boot — the web app via `assertPublicEnv()` /
`@/lib/env`, the worker via `required()` in `env.ts` (and numeric vars are clamped to
safe floors). A missing critical var fails fast rather than running mis-configured.
Confirm the full set from [`.env.example`](../.env.example) is present in each
environment, especially every `STRIPE_PRICE_*` id — the webhook now hard-fails on an
unmapped price rather than silently downgrading a paying customer.

## Dependency & upgrade strategy

- **Pinned by intent:** Stripe API version (`STRIPE_API_VERSION`) and the Supabase
  client are pinned so an SDK bump can't silently change webhook payload shapes.
- **Routine bumps:** patch/minor monthly via PRs; the full CI gate is the safety net.
- **Major bumps** (Next.js, React, Supabase, Stripe API): one per PR, read the
  migration guide, run E2E on staging, watch Sentry after promote.
- Enable Dependabot/Renovate to open these PRs automatically; the audit job blocks
  any that introduce a high/critical advisory.
