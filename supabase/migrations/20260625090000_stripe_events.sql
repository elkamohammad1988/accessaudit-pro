-- Stripe webhook idempotency ledger.
--
-- Stripe delivers each event at-least-once and retries on any non-2xx response.
-- Without a record of what we've already applied, a redelivered event could
-- re-run a handler or clobber newer subscription state. The webhook records an
-- event id here only AFTER it processes successfully, and skips any event id it
-- has already seen. A failed handler returns 500 (so Stripe retries) and leaves
-- no row, so the retry reprocesses cleanly.
--
-- Written exclusively by the webhook via the service-role key. RLS is enabled
-- with no policies so no client (anon/authenticated) can read or write it.

create table if not exists public.stripe_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

comment on table public.stripe_events is
  'Processed Stripe webhook event ids (idempotency guard). Service-role only.';
