# @accessaudit/worker — scan engine

A small always-on Node service that runs the actual accessibility scans. It lives
**off the web request path**: the web app inserts a `scans` row with
`status='queued'`; this worker claims it, runs **Playwright (headless Chromium) +
axe-core**, writes `scan_pages` + `violations`, and flips the scan to
`completed` / `partial` / `failed`. The web UI reflects the change live via
Supabase Realtime.

## How it works

```
loop:
  scan = rpc claim_next_scan()      # atomic: oldest queued → running (SKIP LOCKED)
  if none: sleep(WORKER_POLL_INTERVAL_MS); continue
  for url in scan.target_urls:
    launch page → axe-core(withTags = WCAG level) → violations
  persist scan_pages + violations (service role, RLS bypassed)
  finalize scan: status, score, totals, pages_scanned, finished_at
```

Concurrency-safe across multiple worker instances thanks to
`FOR UPDATE SKIP LOCKED` inside `claim_next_scan()` (migration 0004).

## Run locally

```bash
pnpm install
npx playwright install chromium          # one-time: download the browser binary
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @accessaudit/worker dev
```

Get the URL + **service-role** key from `supabase start` (local) or your Supabase
project settings (prod). The service-role key bypasses RLS — keep it server-side.

## Environment

| Var | Required | Default | Purpose |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | service-role key (RLS bypass) |
| `WORKER_POLL_INTERVAL_MS` | | 3000 | idle poll cadence |
| `WORKER_PAGE_TIMEOUT_MS` | | 30000 | per-page navigation/analysis timeout |
| `WORKER_MAX_NODES` | | 5 | affected-element nodes stored per violation |

## Deploy (Railway — chosen for MVP)

A long-running Node process; **not** serverless (Playwright runs exceed function
timeouts). Use the Playwright Docker image or run
`npx playwright install --with-deps chromium` in the build step, set the two
required env vars, and start with `pnpm --filter @accessaudit/worker start`.
