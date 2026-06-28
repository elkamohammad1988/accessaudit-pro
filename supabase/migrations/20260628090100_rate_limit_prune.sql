-- =============================================================================
-- AccessAudit Pro — 0010 Rate-limit self-pruning
--
-- check_rate_limit() accumulates one row per (action+identity) forever — over
-- time that's one row per unique client IP that ever hit sign-in/sign-up/reset.
-- No cron ships in the MVP, so the function now prunes stale windows itself on a
-- small fraction of calls (amortized, index-backed). Cheap, self-contained, and
-- requires no scheduler. CREATE OR REPLACE preserves the existing grants.
-- =============================================================================

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

  -- Opportunistic maintenance: on ~0.5% of calls, drop windows older than a day
  -- (uses the rate_limits_window_idx index). Bounds table growth without a cron.
  if random() < 0.005 then
    delete from public.rate_limits where window_start < v_now - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;
