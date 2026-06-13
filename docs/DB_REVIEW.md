# AccessAudit Pro — Database Phase: Critical Architecture Review

**Reviewer stance:** Senior SaaS architect challenging the v1.0 schema.
**Date:** 2026-06-13 · **Verdict:** Over-built for an MVP. Cut from **14 tables → 8**.

> ✅ **Decision accepted 2026-06-13 — option (A), single-owner model.** The four
> v1.0 migrations were regenerated to the 8-table MVP described in Part 2:
> `organizations.owner_id`, soft-delete on `clients`/`projects`, share fields folded
> onto `scans`, `violations` denormalized from axe output, one `owns_org()` RLS
> helper. The `wcag_rules` seed is preserved (un-applied) in
> `supabase/reference/wcag_rules_seed.sql`. See [`ERD.md`](./ERD.md) for the
> implemented schema.

---

## TL;DR

The v1.0 schema is a *good production design* mislabeled as an MVP. It front-loads
three expensive capabilities the first customers will not use on day one:

1. **Teams & RBAC** (`organization_members`, `invitations`, 4 roles, `accept_invitation`, 3 RLS helpers) — most launch users are solo freelancers.
2. **Usage metering infrastructure** (`usage_counters`) that nothing actually increments — drift waiting to happen.
3. **A curated reference table** (`wcag_rules`) duplicating data axe-core already returns.

Plus a generic `activity_log` and a `reports` table whose job can be done by two
columns on `scans`. **None of this is wrong — it is just premature.** Build it when
teams, metered billing, and report history are real requirements, not before.

---

## Part 1 — The 10-point critique

### 1. Over-engineering risks for an MVP
**Guilty.** Specific offenders:

| Thing built | Why it is premature |
|---|---|
| 4-role RBAC (`owner/admin/member/viewer`) | Solo/2-person agencies don't need role tiers. Owner-only covers launch. |
| `invitations` + `accept_invitation()` RPC + partial unique index | Team invites are a v1.1 feature per the PRD itself. |
| `organization_members` join + `has_org_role` / `current_org_role` / `shares_organization` | All of this exists *only* to support multiple users per org. |
| `activity_log` | Generic audit logging on day one. The `scans` table is the audit trail that matters. |
| `usage_counters` | A denormalized counter with **no trigger to maintain it** — pure drift risk. |
| `violation_status` (open/ignored/flagged) | Triage is explicitly v1.1 in the PRD. The column ships unused. |
| `reports` table | A whole table + token + expiry machinery for what is, in MVP, "download a PDF" + "one share link." |
| 11 enum types | `member_role`, `invitation_status`, `violation_status`, `report_type` back features we just deferred. Enums are also rigid (`ALTER TYPE ADD VALUE` migrations forever). |

### 2. Tables that can be removed (for MVP)
Removable now, reintroduce in production:

- `organization_members` — collapse to `organizations.owner_id` (single user owns the workspace).
- `invitations` — gone with teams.
- `usage_counters` — replace with a `COUNT(*)` over `scans` for the current period. No table, no drift.
- `activity_log` — `scans` is the compliance record; add a generic log when you have a reason.
- `reports` — fold `share_token` / `is_public` / `shared_at` onto `scans`; generate PDFs on demand (ephemeral, no row).
- `wcag_rules` — **removable but the most defensible to keep.** axe-core already returns `help`, `helpUrl`, `description`, `impact`, and `tags` (WCAG criteria). Denormalize those onto each violation and you don't need the table. Counter-argument: the curated *plain-language fix guidance* is a product differentiator and the 50 rows are already written. **Recommendation: keep it only if you'll actually curate guidance; otherwise drop and use axe output.**

**14 → 8 tables.**

### 3. Complexity that can be postponed
Teams/roles/invites · usage metering · violation triage · curated rule enrichment ·
generic audit log · report artifacts/history/expiry · crawl config (`scan_type=crawl`,
`crawl_config`) · the `handle_new_organization` membership+usage bootstrap (shrinks to
"create free subscription").

### 4. Performance concerns
- **At MVP scale: none.** Tens of orgs, hundreds of scans — Postgres on Supabase is bored.
- **Real (production) concern:** RLS predicates call SECURITY DEFINER helpers that invoke `auth.uid()` **per row**. On a large `violations` scan (hundreds of rows) this is fine; on cross-org analytics over millions of rows it isn't. Production fix: wrap `auth.uid()` in a scalar subselect (`(select auth.uid())`) so the planner evaluates it once (InitPlan), and keep the org-id predicate indexable. Not an MVP problem.
- `violations.nodes` JSONB can bloat on pathological pages (thousands of failing nodes). Cap node count per violation in the worker. Cheap safeguard.

### 5. Cost concerns
- **The database is not the cost driver — the scan worker is.** Headless Chromium is ~300–500 MB resident *per concurrent scan*. Railway memory, not Supabase rows, is the bill. The DB design barely moves cost.
- **Screenshots** (`screenshot_url` + bucket) are a real storage cost for zero MVP value. **Cut screenshots from MVP.**
- JSONB `totals`/`nodes` storage is negligible.

### 6. Security concerns
Findings against my own design:

- **`accept_invitation()` does not verify the accepting user's email matches the invite.** Anyone holding the token can join as the invited role. Low risk (32-byte token) but real if an invite email is forwarded. *(Moot in MVP — invites are postponed. Fix before shipping teams.)*
- **No "last owner" protection.** An admin can demote/remove the owner via the `organization_members` UPDATE policy. *(Moot in MVP.)*
- **Service-role blast radius.** The worker bypasses RLS; a worker bug could write across orgs. Mitigation: worker must derive `organization_id` from the dequeued scan row and never trust input. Document as a hard rule.
- **Share-link enforcement is app-side only.** `is_public` and `expires_at` are inert columns; the Edge Function must enforce them. If that check is wrong, private reports leak. Keep that resolver tiny and tested.
- **No DB-level rate limiting** on scan creation — spam/abuse is an app concern. Acceptable, but note it.

Nothing here is a hole in the *MVP* surface (teams are cut); they are warnings for when the deferred features land.

### 7. Missing indexes
- **Missing and needed:** `scans (organization_id, created_at desc)` — the dashboard "recent scans across the whole org" feed has no supporting index (I only added `(project_id, created_at)` and `(organization_id, status)`).
- In the **owner_id** MVP model, add `organizations (owner_id)` for the "my workspaces" lookup (replaces `organization_members(user_id)`).
- Everything else (FKs, `scan_pages(scan_id)`, `violations(scan_page_id)`, unique tokens) is covered.
- Over-indexing note: `violations (organization_id, impact)` and `violations (rule_id)` are speculative for MVP (no cross-org-by-impact or by-rule query yet). Harmless, but they're write-amplifying indexes for queries that don't exist yet.

### 8. Missing audit trails
- The audit trail that matters for a *compliance* product already exists: **`scans` is an immutable historical record** of what was checked, when, and what was found. Good.
- **Real gap: hard cascade deletes destroy that history.** Deleting a project/client `CASCADE`s away every scan and finding. For a compliance tool that is dangerous. **Recommendation (even in MVP): soft-delete** clients/projects via `archived_at` and never hard-delete scans. Cheap, protects the record.
- Billing/subscription changes are not audited. Fine for MVP (Stripe is the source of truth); add a billing audit in production.

### 9. Missing subscription enforcement
**Biggest substantive gap.** The schema *describes* plans and usage but *enforces nothing*:
- No trigger increments `usage_counters` — it only moves because I hand-set it in the seed.
- No check stops a free org from creating a 6th client or exceeding scan limits.
- **Plan limits live only in the PRD prose** — not in code, not in the DB. No single source of truth.

Decision needed (recommended answers):
- **MVP:** define limits in **app config (one constants module)**; enforce in the app before insert; compute usage with `COUNT(*) FROM scans WHERE organization_id=? AND created_at >= date_trunc('month', now())`. No counter table, no drift.
- **Production:** introduce a `plan_limits` reference table (so limits aren't hard-coded), `usage_counters` with a **trigger that increments on scan insert**, and optionally Stripe metered billing. Add a `can_run_scan(org_id)` SQL function as the single gate.

### 10. Can a solo dev ship this in < 6 weeks?
**The database phase: yes — a few days.** **The full MVP as scoped: optimistic-to-unrealistic.** Honest full-time solo estimate:

| Workstream | Realistic solo time |
|---|---|
| DB + auth + tenancy + clients/projects CRUD | ~1 wk |
| **Scan worker** (Playwright + axe + queue + Railway + real-web error handling: timeouts, JS apps, blocks, auth walls) | **~2 wks (the risk)** |
| Report view + white-label PDF + public link | ~1 wk |
| Stripe (Checkout + Portal + webhook + limit enforcement) | ~1 wk |
| Dashboard + settings + WCAG-AA self-audit + deploy | ~1 wk |
| **Total, zero slack** | **~6 wks** |

That assumes an experienced dev with no learning curve on Playwright/Stripe/Supabase and no real life. **Realistic is 7–9 weeks** for the full scope. To actually hit ≤6 weeks, cut: teams, usage_counters, activity_log, screenshots, report-table, and consider launching with **one paid plan** (Checkout + webhook only, Portal later). The trimmed MVP below is the version that fits.

---

## Part 2 — MVP Database (minimum viable) — **8 tables**

> Model change: **one user owns one workspace** (`organizations.owner_id`). No members table, no roles, no invites. RLS becomes "you can touch org data iff you own the org." Teams are a clean *additive* migration later.

| # | Table | Notes vs v1.0 |
|---|---|---|
| 1 | `profiles` | unchanged (1:1 `auth.users`) |
| 2 | `organizations` | **+`owner_id`**, drop reliance on members; keeps name/slug/logo/brand_color (white-label) + billing anchor |
| 3 | `clients` | **+`archived_at`** (soft delete) |
| 4 | `projects` | **+`archived_at`**; drop `crawl_config` (no crawl in MVP) |
| 5 | `scans` | **+`share_token`, `is_public`, `shared_at`** (absorbs the reports table); `scan_type` limited to `single`/`list` |
| 6 | `scan_pages` | unchanged — needed for URL-list multi-page scans |
| 7 | `violations` | **denormalize** axe output: `rule_id`, `impact`, `wcag_criteria`, `help_text`, `help_url`, `description`. **Drop `status`** (no triage) |
| 8 | `subscriptions` | unchanged — required for Stripe |

**Enums kept:** `scan_status`, `scan_type` (single/list), `wcag_level`, `page_status`, `impact_level`, `plan_tier`, `subscription_status`.
**Enums dropped:** `member_role`, `invitation_status`, `violation_status`, `report_type`.

**Functions/triggers kept:** `handle_new_user`, `set_updated_at`, a slim org-insert trigger that creates only the free `subscriptions` row.
**Dropped:** `handle_new_organization` (membership/usage parts), `has_org_role`, `current_org_role`, `shares_organization`, `accept_invitation`. RLS uses one helper: `owns_org(org_id)`.

**Indexes added:** `scans (organization_id, created_at desc)`, `organizations (owner_id)`.
**Indexes dropped:** `organization_members_*`, and defer the speculative `violations (organization_id, impact)` / `violations (rule_id)`.

**Subscription enforcement:** plan limits in an app constants module; usage via `COUNT(*)` on `scans` for the period; enforce in app before insert.

**Result:** ~8 tables, 7 enums, 1 RLS helper, 2–3 triggers, no RPC. A solo dev can stand this up in days and the RLS surface is trivially auditable.

---

## Part 3 — Production Database (future) — reintroduce on demand

Bring each back when its feature is actually scheduled:

| Capability | Tables / objects to add back | Trigger to build it |
|---|---|---|
| **Teams & RBAC** | `organization_members` (+roles), `invitations`, `accept_invitation()`, `has_org_role`/`shares_organization`; migrate `owner_id` → an `owner` membership row | First customer asks for a second seat |
| **Metered billing & hard limits** | `plan_limits` (reference), `usage_counters` (+increment trigger), `can_run_scan()` gate, Stripe metered prices | Abuse appears, or you want overage revenue |
| **Curated remediation** | `wcag_rules` (the 50 rows already written) as enrichment over denormalized violation data | You invest in best-in-class fix guidance |
| **Report artifacts & history** | `reports` (multiple PDFs, branded variants, expiry, revocation history) | Clients want a library of past deliverables |
| **Full audit** | `activity_log`, billing audit, **soft-delete/retention** everywhere | Compliance/enterprise buyers, SOC2 |
| **Screenshots / visual evidence** | `screenshots` bucket + `screenshot_url` | Reports need visual proof |
| **Scheduled monitoring (v2)** | `scan_schedules`, regression `scan_comparisons` (diff new/fixed/persisting) | The roadmap's v2 |
| **Triage workflow** | `violations.status` (+`violation_status` enum), assignment, comments | Teams manage findings over time |
| **API access (Scale plan)** | `api_keys` (hashed), rate-limit counters | Scale-tier customers |
| **Scale hardening** | partition `scans`/`violations` by time; `(select auth.uid())` RLS rewrite; covering indexes | Real data volume |

---

## Part 4 — Stay vs Postpone (the explicit matrix)

| Object | MVP | Production | Rationale |
|---|---|---|---|
| `profiles` | ✅ stay | ✅ | Core identity |
| `organizations` (+`owner_id`) | ✅ stay | ✅ (owner_id → membership) | Tenant + billing + branding anchor |
| `clients` (+`archived_at`) | ✅ stay | ✅ | Core domain |
| `projects` (+`archived_at`, −`crawl_config`) | ✅ stay | ✅ (+crawl_config) | Core domain |
| `scans` (+share fields) | ✅ stay | ✅ | Core + the real audit trail |
| `scan_pages` | ✅ stay | ✅ | URL-list scans need it |
| `violations` (denormalized, −status) | ✅ stay | ✅ (+status) | Core findings |
| `subscriptions` | ✅ stay | ✅ | Stripe required |
| `organization_members` | ⏸ postpone | ✅ | Teams |
| `invitations` (+RPC) | ⏸ postpone | ✅ | Teams |
| `usage_counters` | ⏸ postpone (use COUNT) | ✅ (+trigger) | Metering |
| `plan_limits` | ⏸ (app config) | ✅ | Single source of truth |
| `wcag_rules` | ⏸ (use axe output)* | ✅ | Curated guidance |
| `reports` | ⏸ (fold onto scans) | ✅ | Artifact history |
| `activity_log` | ⏸ postpone | ✅ | Generic audit |
| `screenshots` | ⏸ postpone | ✅ | Visual evidence |
| `scan_schedules` / `scan_comparisons` | ❌ out | ✅ (v2) | Scheduled monitoring |
| `api_keys` | ❌ out | ✅ (Scale) | API access |

\* `wcag_rules` is the one cut you might reasonably reverse now, since the data is written and curated guidance sells. Keeping it costs one join.

---

## Recommended decision before regenerating migrations

**One fork matters:** the workspace ownership model.

- **(A) Recommended — `organizations.owner_id`, single user per workspace.** Leanest MVP, trivial RLS, fits the solo-freelancer launch user. Teams added later as an additive migration.
- **(B) Keep a minimal `organization_members`** (owner/member only, no invites) if you are confident multi-user agencies are a *launch-week* need and want to avoid the later ownership migration.

I recommend **(A)**. If you agree, the next step (on your approval) is to regenerate the four migrations for the 8-table MVP schema. Until then, no code.

> **Resolved:** (A) was approved and the migrations were regenerated on 2026-06-13.
> The database phase is complete; the next phase is the app (auth + tenancy +
> clients/projects CRUD), then the scan worker.
