# AccessAudit Pro — Disaster Recovery & Business Continuity

Scope: how we back up state, how fast we can recover, and the exact steps to do
it. Pairs with [`DEPLOYMENT.md`](DEPLOYMENT.md) (first go-live) and
[`RUNBOOKS.md`](RUNBOOKS.md) (incident playbooks).

## What holds state (and what doesn't)

| Component | Stateful? | Recovery model |
|---|---|---|
| **Supabase Postgres** | ✅ the only source of truth | Backups + PITR (below) |
| **Supabase Storage** (org/client logos) | ✅ small object store | Supabase backup / re-upload |
| **Web app** (Next.js, e.g. Vercel) | ❌ stateless | Redeploy from git |
| **Worker** (Playwright, e.g. Railway) | ❌ stateless; in-flight scans are reaped & requeued | Redeploy from git |
| **Stripe** | external system of record for billing | Re-syncs via webhook; see runbook |

Because only the database (and a small logo bucket) are stateful, DR is almost
entirely a **database** problem. The app tiers are cattle: redeploy and they're back.

## Objectives

| Metric | Target | Basis |
|---|---|---|
| **RPO** (max data loss) | **≤ 5 min** | Postgres PITR (WAL) on Supabase Pro+ |
| **RPO** (backups only, no PITR) | ≤ 24 h | daily automated backup — **enable PITR to beat this** |
| **RTO** app tier | ≤ 10 min | git redeploy of web + worker |
| **RTO** database | ≤ 60 min | PITR restore + repoint |

> **Action for go-live:** enable **Point-in-Time Recovery** on the Supabase project
> (Pro plan or higher, Database → Backups). Without it, RPO is a full day.

## Backups

- **Automated:** Supabase takes daily logical backups on paid plans; PITR adds
  continuous WAL archiving (configurable retention, typically 7 days).
- **Off-platform copy (recommended monthly):** export an independent dump so a
  Supabase-account-level incident can't take the backups with it:
  ```bash
  supabase db dump --db-url "$SUPABASE_DB_URL" -f backup-$(date +%F).sql
  # store encrypted in object storage outside the Supabase account
  ```
- **Storage bucket:** logos are non-critical (re-uploadable) but are included in
  Supabase backups.

## Restore procedures

### A. Point-in-time restore (data corruption, bad migration, accidental delete)
1. Supabase Dashboard → Database → Backups → **Restore** → pick the timestamp just
   *before* the incident.
2. Supabase restores into the project (or a clone — prefer a clone to validate first).
3. Validate row counts on `organizations`, `subscriptions`, `scans`.
4. If restored into a clone, repoint `NEXT_PUBLIC_SUPABASE_URL` /
   `SUPABASE_SERVICE_ROLE_KEY` (web + worker) to the clone and redeploy.

### B. Full rebuild from dump (account loss / region migration)
1. Create a new Supabase project (target region).
2. `supabase db push` to apply all migrations (schema, RLS, RPCs, realtime publication).
3. Restore data: `psql "$NEW_DB_URL" -f backup-YYYY-MM-DD.sql`.
4. Re-create the Stripe webhook endpoint pointing at the (unchanged) app URL; the
   `subscriptions` table re-syncs on the next subscription event, or backfill with
   a one-off `stripe.subscriptions.list` reconciliation.
5. Update env on web + worker hosts; redeploy.

### C. App tier only (host outage, bad release)
- **Web:** instant rollback to the previous deployment (Vercel: Deployments →
  Promote previous). No data impact.
- **Worker:** redeploy previous image (Railway). In-flight scans left `running`
  are auto-requeued by the stale-scan reaper once a worker is back.

## Region failure

A Supabase project is single-region. Mitigation, in order of cost:
1. **PITR + documented rebuild (B)** into another region — RTO ~1 h. *(Current plan.)*
2. **Warm standby:** a second Supabase project in another region with periodic
   restores; promote on failure — lower RTO, higher cost. Adopt at enterprise scale.

The web/worker tiers are multi-region-capable by redeploy; the constraint is always
the database.

## Incident response

| Severity | Definition | Response |
|---|---|---|
| **SEV-1** | Data loss / breach / full outage | Page on-call immediately; start incident doc; restore per A/B |
| **SEV-2** | Degraded (queue backed up, webhook failing) | Triage within 30 min; see [`RUNBOOKS.md`](RUNBOOKS.md) |
| **SEV-3** | Minor / single-tenant | Next business day |

Flow: **declare** (sev + owner) → **mitigate** (stop the bleeding: rollback, scale,
restore) → **communicate** (status to affected orgs) → **resolve** → **post-mortem**
(blameless, within 5 business days, with action items).

## Recovery testing

DR you haven't tested is a hope, not a plan. **Quarterly:** restore the latest
backup into a throwaway Supabase project, run the [`RUNBOOKS.md`](RUNBOOKS.md)
data-integrity checks and the app smoke test ([`DEPLOYMENT.md`](DEPLOYMENT.md) §6),
record the measured RTO, and file any gaps. Tracked in the release calendar.
