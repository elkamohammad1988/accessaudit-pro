# AccessAudit Pro — Deployment / go-live guide

The codebase is complete and builds clean. Going live needs **your accounts** and
their credentials (Supabase, a host for the web app, Railway for the worker,
Stripe). This is the end-to-end checklist.

> Architecture recap: **web app** (Next.js) queues scans → **Postgres** holds the
> queue → **worker** (Playwright + axe-core) runs them off the request path →
> results stream back to the UI. Billing is Stripe; the webhook keeps the
> `subscriptions` table in sync.

---

## 1. Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com). Note the **project URL**,
   **anon key**, and **service-role key** (Settings → API).
2. Link and push migrations (applies `supabase/migrations/` — 8-table schema, RLS,
   triggers, the `claim_next_scan` queue RPC, and the realtime publication):
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
3. Auth → URL configuration: set the **Site URL** to your production domain and add
   `https://<domain>/auth/callback` to the redirect allow-list.
4. (Optional) Email templates / SMTP for verification + magic links.

Realtime on `scans` is enabled by migration 0004; the UI also polls as a fallback,
so live progress works even if realtime is off.

## 2. Web app (Vercel or any Next host)

Deploy `apps/web`. Set environment variables (see [`.env.example`](../.env.example)):

| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | from Stripe (step 4) |
| `STRIPE_PRICE_STARTER` / `_AGENCY` / `_SCALE` | Stripe Price ids (step 4) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

Build command `pnpm build`, output is a standard Next.js app.

## 3. Scan worker (Railway)

The worker needs Chromium and a long-running process — **not** serverless.

1. New Railway service from this repo; root or `apps/worker`.
2. Build step installs Chromium: `npx playwright install --with-deps chromium`
   (or use a Playwright base image).
3. Start command: `pnpm --filter @accessaudit/worker start`.
4. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (optional: `WORKER_POLL_INTERVAL_MS`,
   `WORKER_PAGE_TIMEOUT_MS`, `WORKER_MAX_NODES`).

Scale horizontally if needed — `claim_next_scan()` uses `FOR UPDATE SKIP LOCKED`,
so multiple workers won't double-process a job.

## 4. Stripe (billing)

1. Create three **Products** (Starter, Agency, Scale), each with a monthly recurring
   **Price**. Put the Price ids in `STRIPE_PRICE_*`.
2. Add a webhook endpoint → `https://<domain>/api/stripe/webhook`, subscribe to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
3. Test locally with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## 5. Smoke test (the MVP acceptance path)

1. Sign up → verify email → create organization.
2. Add a client → add a project (a public URL).
3. New scan → watch it go `queued → running → completed` live.
4. Open the report: score, impact breakdown, violations with fix guidance.
5. Create a public share link → open it in a private window.
6. Upgrade via Checkout (test card `4242 4242 4242 4242`) → confirm the plan and
   limits change → export a branded PDF and CSV.

## Still TODO before a paid launch (Phase 5 tail)

- Sentry (the `(app)/error.tsx` boundary already logs; wire the DSN).
- Playwright e2e tests for the core flow; load-test the scan queue.
- Email deliverability (SMTP) and onboarding copy polish.
- Legal: confirm the automated-vs-manual disclaimer wording with counsel.
