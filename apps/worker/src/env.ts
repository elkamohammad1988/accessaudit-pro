/** Worker environment. Uses the service-role key, which BYPASSES RLS — server-only. */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. See apps/worker/README.md.`);
  }
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  supabaseUrl: required("SUPABASE_URL"),
  serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  // Floors guard against a misconfigured env (e.g. POLL_INTERVAL_MS=0 busy-spins
  // the CPU; a negative timeout breaks the timing logic). Each clamps to a sane
  // minimum rather than trusting the raw value.
  /** How often to poll for queued scans when idle (ms). */
  pollIntervalMs: Math.max(250, numberEnv("WORKER_POLL_INTERVAL_MS", 3000)),
  /** Per-page navigation/analysis timeout (ms). */
  pageTimeoutMs: Math.max(1000, numberEnv("WORKER_PAGE_TIMEOUT_MS", 30000)),
  /** Best-effort network-settle wait after load before running axe (ms). */
  settleMs: Math.max(0, numberEnv("WORKER_SETTLE_MS", 5000)),
  /** Cap affected-element nodes stored per violation (avoids JSONB bloat). */
  maxNodesPerViolation: Math.max(1, numberEnv("WORKER_MAX_NODES", 5)),
  /** A scan stuck in 'running' longer than this is reaped (ms). */
  staleScanMs: Math.max(60_000, numberEnv("WORKER_STALE_SCAN_MS", 1_800_000)),
  /** Pages scanned in parallel within a single scan. */
  scanConcurrency: Math.max(1, numberEnv("WORKER_SCAN_CONCURRENCY", 3)),
  /** Max times a scan is claimed before it is dead-lettered to 'failed'. */
  maxAttempts: Math.max(1, numberEnv("WORKER_MAX_ATTEMPTS", 3)),
  /** Relaunch Chromium once this many pages have run since launch (bounds memory). */
  recycleAfterPages: Math.max(1, numberEnv("WORKER_RECYCLE_AFTER_PAGES", 200)),
  /** Port for the /health + /metrics HTTP server (0 disables it). */
  healthPort: numberEnv("WORKER_HEALTH_PORT", 8080),
};
