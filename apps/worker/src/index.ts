// Imported first so the root .env(.local) is loaded before any module reads
// process.env (env.ts asserts required vars, sentry.ts reads SENTRY_DSN).
import "./load-env";
// Imported next so Sentry is initialized before anything it instruments.
import { captureError, flushSentry } from "./sentry";
import type { Browser } from "playwright";
import type { Scan } from "@accessaudit/database";
import type { WcagLevel } from "@accessaudit/shared";
import { env } from "./env";
import { supabase } from "./supabase";
import { persistAndFinalize, summarize } from "./persistence";
import { launchBrowser, scanPage, type PageScanResult } from "./scanner";
import { markAlive, startHealthServer } from "./health";

/**
 * Hard ceiling on graceful drain. Orchestrators (Railway/K8s) send SIGTERM then
 * SIGKILL after their own grace window (~30s). We force our own clean exit a few
 * seconds inside that so Sentry flushes and the browser closes, rather than being
 * SIGKILLed mid-write (which the reaper would then have to clean up).
 */
const SHUTDOWN_FORCE_MS = 25_000;

let shuttingDown = false;
let browser: Browser | null = null;
/** In-flight launch latch so concurrent page scans don't race to relaunch. */
let browserPromise: Promise<Browser> | null = null;
/** Pages run since the current Chromium launched; drives periodic recycling. */
let pagesSinceLaunch = 0;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Reuse one Chromium instance across scans; relaunch if it crashed/disconnected.
 * Guarded by a single launch promise so that, under page-level concurrency, two
 * scans hitting a dead browser at once don't each spawn a leaked instance.
 */
function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return Promise.resolve(browser);
  if (!browserPromise) {
    browserPromise = (async () => {
      if (browser) {
        try {
          await browser.close();
        } catch {
          /* already gone */
        }
      }
      browser = await launchBrowser();
      pagesSinceLaunch = 0;
      return browser;
    })();
    // Release the latch once it settles so a future crash can relaunch.
    browserPromise.finally(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

/** Close and drop Chromium once it has handled enough pages (bounds memory). */
async function maybeRecycleBrowser(): Promise<void> {
  if (browser && pagesSinceLaunch >= env.recycleAfterPages) {
    console.log(`Recycling Chromium after ${pagesSinceLaunch} pages.`);
    try {
      await browser.close();
    } catch {
      /* ignore */
    }
    browser = null;
  }
}

function targetUrls(scan: Scan): string[] {
  const raw = scan.target_urls;
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string");
  }
  return [];
}

async function claimScan(): Promise<Scan | null> {
  const { data, error } = await supabase.rpc("claim_next_scan");
  if (error) {
    console.error("claim_next_scan failed:", error.message);
    return null;
  }
  // claim_next_scan() is declared `RETURNS public.scans` (a single composite row),
  // not SETOF. When nothing is queued it does `RETURN null`, which PostgREST
  // serializes as an all-null row object ({ id: null, ... }) — NOT JSON null. So
  // `data` is truthy even with no work to do. Key off the primary key to tell a
  // real claim apart from that phantom empty row, so we never go on to query with
  // a null id (which becomes the literal `id=eq.null` → "invalid input syntax for
  // type uuid: null").
  if (!data?.id) return null;
  return data;
}

/**
 * Sweep scans stuck in 'running' past the stale threshold — e.g. a worker that
 * crashed mid-job. Keyed off `last_progress_at` (the per-page heartbeat), NOT
 * `started_at`, so a long but healthy multi-page scan is never reaped. A stale
 * scan with retries left is requeued; one that's out of attempts is failed
 * (dead-lettered). Idempotent and safe to run from multiple workers.
 */
async function reapStaleScans(): Promise<void> {
  const cutoff = new Date(Date.now() - env.staleScanMs).toISOString();

  // Out of retries → terminal failure.
  const { error: failErr } = await supabase
    .from("scans")
    .update({
      status: "failed",
      error_reason: "Scan timed out — the worker did not finish in time. Try re-scanning.",
      finished_at: new Date().toISOString(),
    })
    .eq("status", "running")
    .lt("last_progress_at", cutoff)
    .gte("attempts", env.maxAttempts);
  if (failErr) console.error("reapStaleScans (fail) failed:", failErr.message);

  // Retries remaining → requeue for another worker cycle.
  const { error: requeueErr } = await supabase
    .from("scans")
    .update({ status: "queued", started_at: null, last_progress_at: null })
    .eq("status", "running")
    .lt("last_progress_at", cutoff)
    .lt("attempts", env.maxAttempts);
  if (requeueErr) console.error("reapStaleScans (requeue) failed:", requeueErr.message);
}

/** Push the heartbeat forward so the reaper can see this scan is still alive. */
async function heartbeat(scanId: string): Promise<void> {
  const { error } = await supabase
    .from("scans")
    .update({ last_progress_at: new Date().toISOString() })
    .eq("id", scanId)
    .eq("status", "running");
  if (error) console.error(`heartbeat failed for ${scanId}:`, error.message);
}

/**
 * Apply a terminal patch, but only while the scan is still 'running'. The guard
 * means a scan the reaper already failed is never silently un-failed by a job
 * that finishes a moment later — the two can't fight over the final row.
 */
async function finalize(scanId: string, patch: Partial<Scan>): Promise<void> {
  const { error } = await supabase
    .from("scans")
    .update(patch)
    .eq("id", scanId)
    .eq("status", "running");
  if (error) console.error(`Failed to finalize scan ${scanId}:`, error.message);
}

/**
 * Decide a failed scan's fate: requeue it if it's a retryable failure with
 * attempts remaining, otherwise dead-letter it to a terminal 'failed'. `attempts`
 * on the claimed row already counts this run (claim_next_scan increments it).
 */
async function failOrRetry(scan: Scan, reason: string, retryable: boolean): Promise<void> {
  const attempts = scan.attempts ?? 0;
  if (retryable && attempts < env.maxAttempts) {
    const { error } = await supabase
      .from("scans")
      .update({ status: "queued", started_at: null, last_progress_at: null, error_reason: null })
      .eq("id", scan.id)
      .eq("status", "running");
    if (error) {
      console.error(`requeue failed for ${scan.id}:`, error.message);
    } else {
      console.log(`scan ${scan.id} requeued (attempt ${attempts}/${env.maxAttempts}): ${reason}`);
    }
    return;
  }
  await finalize(scan.id, {
    status: "failed",
    error_reason: retryable ? `${reason} (gave up after ${attempts} attempts)` : reason,
    finished_at: new Date().toISOString(),
  });
  // Dead-letter — surface to Sentry so we're not blind to scans that never succeed.
  captureError(new Error(reason), { scanId: scan.id, scope: "deadLetter", attempts: String(attempts) });
}

/**
 * Scan every URL with bounded concurrency. Results keep input order. A hard
 * failure with no HTTP response is retried once (transient). The browser is
 * re-fetched per page so a mid-scan crash is recovered for the next page.
 */
async function scanAllPages(
  scan: Scan,
  urls: string[],
  level: WcagLevel,
  scanOpts: { timeoutMs: number; maxNodes: number; settleMs: number },
): Promise<PageScanResult[]> {
  const results = new Array<PageScanResult>(urls.length);
  let cursor = 0;
  const workerCount = Math.min(env.scanConcurrency, urls.length);

  async function runWorker(): Promise<void> {
    while (!shuttingDown) {
      const index = cursor++;
      if (index >= urls.length) return;
      const url = urls[index]!;
      let result = await scanPage(await getBrowser(), url, level, scanOpts);
      // Retry a hard, response-less failure ONCE — but not while shutting down
      // (a second ~60s page scan can blow past the orchestrator's kill window).
      if (!result.ok && result.httpStatus === null && !shuttingDown) {
        await heartbeat(scan.id);
        result = await scanPage(await getBrowser(), url, level, scanOpts);
      }
      results[index] = result;
      pagesSinceLaunch += 1;
      await heartbeat(scan.id);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}

async function processScan(scan: Scan): Promise<void> {
  const urls = targetUrls(scan);
  if (urls.length === 0) {
    // Misconfigured input, not transient — terminal failure, no retry.
    await failOrRetry(scan, "No target URLs.", false);
    return;
  }

  const level = scan.wcag_level as WcagLevel;
  const scanOpts = {
    timeoutMs: env.pageTimeoutMs,
    maxNodes: env.maxNodesPerViolation,
    settleMs: env.settleMs,
  };

  let pages: PageScanResult[];
  try {
    pages = await scanAllPages(scan, urls, level, scanOpts);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failOrRetry(scan, `Browser error: ${message}`, true);
    console.error(`scan ${scan.id} browser error:`, message);
    captureError(err, { scanId: scan.id, scope: "scanAllPages" });
    return;
  }

  // Summary is derived from in-memory results, so we decide the terminal status
  // (and whether to persist) before writing.
  const summary = summarize(pages);
  if (summary.allFailed) {
    // Every page failed — often a transient target outage; retry then give up.
    await failOrRetry(scan, summary.firstError ?? "All pages failed.", true);
    return;
  }

  const status = summary.anyFailed ? "partial" : "completed";
  try {
    // One atomic RPC writes the results AND finalizes the scan row; returns false
    // if the reaper already took the scan over, in which case we leave it alone.
    const applied = await persistAndFinalize(scan, pages, status, summary);
    if (!applied) {
      console.log(`scan ${scan.id} no longer running (reaper took over); skipped persist.`);
      return;
    }
    console.log(
      `scan ${scan.id} → ${status} (${summary.pagesScanned}/${pages.length} pages, score ${summary.score})`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // DB write failures are usually transient — requeue, dead-letter on exhaustion.
    await failOrRetry(scan, message, true);
    console.error(`scan ${scan.id} persistence error:`, message);
    captureError(err, { scanId: scan.id, scope: "persistAndFinalize" });
  }
}

async function loop(): Promise<void> {
  console.log("AccessAudit scan worker started. Polling for queued scans…");
  while (!shuttingDown) {
    markAlive(); // liveness heartbeat for /health
    await reapStaleScans();

    const scan = await claimScan();
    if (!scan) {
      await sleep(env.pollIntervalMs);
      continue;
    }
    console.log(`Claimed scan ${scan.id} (${scan.scan_type}, WCAG ${scan.wcag_level})`);
    await processScan(scan);
    await maybeRecycleBrowser();
  }

  if (browser) {
    try {
      await browser.close();
    } catch {
      /* ignore */
    }
  }
  console.log("Worker stopped cleanly.");
}

let forceExitTimer: NodeJS.Timeout | null = null;
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (shuttingDown) {
      // Second signal — operator wants out now.
      console.log(`\n${signal} again — forcing immediate exit.`);
      process.exit(0);
    }
    console.log(`\n${signal} received — finishing the current job, then exiting.`);
    shuttingDown = true;
    // Hard deadline: never let "graceful" drain exceed the orchestrator's kill
    // window. A scan still running at the deadline is left for the reaper.
    forceExitTimer = setTimeout(() => {
      console.error(`Graceful shutdown exceeded ${SHUTDOWN_FORCE_MS}ms — forcing exit.`);
      void flushSentry().finally(() => process.exit(0));
    }, SHUTDOWN_FORCE_MS);
    forceExitTimer.unref?.();
  });
}

// Liveness/metrics endpoint for orchestrators and dashboards (gated on a port).
const stopHealthServer = startHealthServer();

loop()
  .then(async () => {
    if (forceExitTimer) clearTimeout(forceExitTimer);
    await stopHealthServer();
    await flushSentry();
  })
  .catch(async (err) => {
    console.error("Fatal worker error:", err);
    captureError(err, { scope: "worker.loop" });
    await stopHealthServer();
    await flushSentry();
    process.exit(1);
  });
