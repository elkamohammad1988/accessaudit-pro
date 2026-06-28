import { createServer, type Server } from "node:http";
import { env } from "./env";
import { supabase } from "./supabase";

/**
 * Tiny HTTP server exposing worker/queue observability:
 *   GET /health   → 200 if the poll loop is alive; 503 if it has stalled (no DB hit)
 *   GET /metrics  → queue depth, running scans, oldest-queued age, recent failures
 * Bound to WORKER_HEALTH_PORT (set to 0 to disable). Kept dependency-free
 * (node:http) so it never competes with Chromium for resources.
 */

// Liveness: the poll loop bumps this each iteration. If it goes stale the loop is
// wedged (a hung scan, a deadlock) even though the process is up — so /health
// returns 503 and the orchestrator restarts us, instead of a static 200 that
// can't tell a healthy worker from a stuck one.
let lastAliveAt = Date.now();
const LIVENESS_STALE_MS = 180_000; // 3 min — far longer than a normal poll cycle.

/** Called by the worker loop each iteration to prove it's still cycling. */
export function markAlive(): void {
  lastAliveAt = Date.now();
}

export interface QueueMetrics {
  queued: number;
  running: number;
  oldestQueuedAgeSeconds: number | null;
  failedLastHour: number;
  generatedAt: string;
}

export async function collectMetrics(): Promise<QueueMetrics> {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const head = () => supabase.from("scans").select("id", { count: "exact", head: true });

  const [queued, running, failed, oldest] = await Promise.all([
    head().eq("status", "queued"),
    head().eq("status", "running"),
    head().eq("status", "failed").gte("finished_at", oneHourAgo),
    supabase
      .from("scans")
      .select("created_at")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const oldestQueuedAgeSeconds = oldest.data?.created_at
    ? Math.max(0, Math.round((Date.now() - new Date(oldest.data.created_at).getTime()) / 1000))
    : null;

  return {
    queued: queued.count ?? 0,
    running: running.count ?? 0,
    oldestQueuedAgeSeconds,
    failedLastHour: failed.count ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

/** Start the server. Returns a stop() that resolves once it's closed. */
export function startHealthServer(): () => Promise<void> {
  if (!env.healthPort) {
    return async () => {};
  }

  const server: Server = createServer((req, res) => {
    const url = req.url ?? "/";

    if (url === "/health" || url === "/") {
      const ageMs = Date.now() - lastAliveAt;
      const alive = ageMs <= LIVENESS_STALE_MS;
      res.writeHead(alive ? 200 : 503, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: alive ? "ok" : "stale", lastAliveAgeMs: ageMs }));
      return;
    }

    if (url === "/metrics") {
      collectMetrics()
        .then((metrics) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(metrics));
        })
        .catch((err: unknown) => {
          res.writeHead(503, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "metrics unavailable", detail: String(err) }));
        });
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  server.on("error", (err) => {
    // A taken port must not take the worker down — log and carry on headless.
    console.error(`Health server error (port ${env.healthPort}):`, err.message);
  });

  server.listen(env.healthPort, () => {
    console.log(`Health server listening on :${env.healthPort} (/health, /metrics)`);
  });

  return () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
}
