-- =============================================================================
-- AccessAudit Pro — 0009 Rate limiting
--
-- A durable, fixed-window rate limiter backed by Postgres (no Redis in the MVP,
-- and serverless instances don't share memory — so an in-process limiter would
-- be trivially bypassed by hitting a different lambda). check_rate_limit() does a
-- single atomic upsert and returns whether the caller is still under the limit.
--
-- SECURITY DEFINER + an unprivileged-readable design: the function is the only
-- way to touch the table. Granted to anon (pre-auth flows like sign-in) and
-- authenticated (in-app actions); the worker uses service_role.
-- =============================================================================

create table if not exists public.rate_limits (
  key          text primary key,
  count        int  not null default 0,
  window_start timestamptz not null default now()
);

comment on table public.rate_limits is
  'Fixed-window rate-limit counters keyed by action+identity (e.g. auth:signin:<ip>). Written only via check_rate_limit().';

-- No client may read or write the table directly; RLS on with zero policies.
alter table public.rate_limits enable row level security;

-- Returns TRUE while the caller is within the limit, FALSE once it's exceeded.
-- Window resets lazily on the first call after it elapses.
create or replace function public.check_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now   timestamptz := now();
  v_count int;
begin
  insert into public.rate_limits as rl (key, count, window_start)
    values (p_key, 1, v_now)
  on conflict (key) do update
    set count = case
                  when rl.window_start < v_now - make_interval(secs => p_window_seconds)
                    then 1
                  else rl.count + 1
                end,
        window_start = case
                  when rl.window_start < v_now - make_interval(secs => p_window_seconds)
                    then v_now
                  else rl.window_start
                end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

comment on function public.check_rate_limit(text, int, int) is
  'Atomic fixed-window rate limit. Returns true while under p_max requests per p_window_seconds for p_key.';

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated, service_role;

-- Lets a cron/maintenance job prune stale windows without scanning the PK.
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);
