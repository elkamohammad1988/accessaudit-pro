# AccessAudit Pro — Operational Runbooks

Concrete playbooks for the failure modes that actually happen. Each lists the
**signal**, how to **diagnose**, and how to **mitigate**. Pairs with
[`DISASTER_RECOVERY.md`](DISASTER_RECOVERY.md).

Key observability surfaces:
- **Worker:** `GET /metrics` → `{ queued, running, oldestQueuedAgeSeconds, failedLastHour }`;
  `GET /health` → 200 alive / 503 stalled (orchestrator restarts on 503).
- **Errors:** Sentry (web client/server + worker), once `SENTRY_DSN` is set.
- **Billing:** Stripe Dashboard → Developers → Webhooks (delivery + retries).

---

## 1. Scan queue backing up

**Signal:** `oldestQueuedAgeSeconds` climbing into minutes; users report "stuck on queued."

**Diagnose:**
- `curl https://<worker>/metrics` — is `running` > 0 (working but slow) or 0 (not claiming)?
- `curl https://<worker>/health` — 503 means the poll loop is wedged → it should
  self-restart; if it doesn't, restart the service.
- Check worker logs for Chromium launch / OOM errors.

**Mitigate:**
- **Throughput:** scale the worker horizontally — `claim_next_scan()` uses
  `FOR UPDATE SKIP LOCKED`, so N workers never double-process. Add instances.
- **Per-instance:** raise `WORKER_SCAN_CONCURRENCY` (watch memory — each page is a
  Chromium context). If OOM, lower it and add instances instead.
- **Wedged loop:** restart the worker; in-flight `running` scans are reaped and
  requeued automatically after `WORKER_STALE_SCAN_MS`.

## 2. Scans failing en masse

**Signal:** `failedLastHour` spikes; Sentry `deadLetter` events.

**Diagnose:** Sentry breadcrumbs — is the error per-target (HTTP 4xx/5xx, navigation
timeout → the *target* sites are down, not us) or systemic (browser launch, DB write
→ our infra)?

**Mitigate:**
- Target-side: no action; scans correctly record `failed`/`partial` with a reason.
- Browser launch failures: verify the Chromium install on the worker image
  (`playwright install --with-deps chromium`); redeploy.
- DB write failures: see runbook 4. Failed scans with attempts remaining requeue
  themselves; exhausted ones dead-letter to `failed` and surface in Sentry.

## 3. Stripe webhook failing

**Signal:** Stripe Dashboard shows non-2xx deliveries / retries; plans not updating
after checkout.

**Diagnose:**
- **400** = signature failure → `STRIPE_WEBHOOK_SECRET` mismatch (re-copy from Stripe).
- **500** = handler threw. Common cause: **unmapped price id** — the handler now
  *intentionally* throws so a missing `STRIPE_PRICE_*` env var can't silently
  downgrade a paying customer. Set the missing var and Stripe's retry self-heals.
- Idempotency: events are de-duplicated via the `stripe_events` ledger; safe to
  **Resend** from the Stripe dashboard.

**Mitigate:** fix the env/secret, then **Resend** the failed events from Stripe. To
reconcile drift, re-run a `stripe.subscriptions.list` sync against `subscriptions`.

## 4. Database pressure / connection exhaustion

**Signal:** web/worker errors like "remaining connection slots are reserved" or
timeouts; Supabase Dashboard → Database → high connection count.

**Diagnose:** identify the source — serverless web functions open many short
connections; the worker holds a few long ones.

**Mitigate:**
- Use the **Supabase connection pooler** (pgBouncer, transaction mode) URL for the
  web app's serverless connections; reserve direct connections for the worker.
- Raise the plan's connection/compute tier if sustained.
- Check for a runaway query in Supabase → Reports.

## 5. Elevated error rate after a release

**Signal:** Sentry error rate jumps right after a deploy.

**Mitigate:** **roll back first, debug second.**
- Web: promote the previous Vercel deployment (instant, no data impact).
- Worker: redeploy the previous Railway image.
- If a migration is implicated, see [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)
  (expand-contract means the prior app version still works against the new schema;
  if not, apply the compensating migration).

## 6. GDPR data request (erasure / export)

**Signal:** a user/org requests their data or account deletion.

**Steps:**
- **Export:** dump the org's rows (`organizations`, `clients`, `projects`, `scans`,
  `scan_pages`, `violations`, `subscriptions`) filtered by `organization_id`.
- **Erasure:** delete the **auth user** — `owner_id` FKs cascade
  (`on delete cascade`), removing the org and all child data. Then cancel the Stripe
  subscription and delete the Stripe customer. Confirm in writing.
- Note: clients/projects are *soft*-deleted (`archived_at`) in normal use; a true
  erasure request uses the hard cascade above, not archival.

## 7. Suspected security incident

Treat as **SEV-1**. Rotate `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY`,
review Supabase auth logs + Sentry, restore clean data per
[`DISASTER_RECOVERY.md`](DISASTER_RECOVERY.md) if integrity is in doubt, and follow
the breach-notification timelines in the privacy policy / applicable law.

---

### On-call expectations
A single on-call owner per rotation, reachable for SEV-1/2. The `/health` and
`/metrics` endpoints should back an uptime monitor (e.g. a 1-minute check on
`/health`, alert on two consecutive failures) and a queue-age alert
(`oldestQueuedAgeSeconds > 600`). Wire these to your pager before launch.
