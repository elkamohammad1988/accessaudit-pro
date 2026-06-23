// Imported first so Sentry is initialized before anything it instruments.
import { captureError, flushSentry } from "./sentry";
import type { Browser } from "playwright";
import type { Scan } from "@accessaudit/database";
import type { WcagLevel } from "@accessaudit/shared";
import { env } from "./env";
import { supabase } from "./supabase";
import { persistResults } from "./persistence";
import { launchBrowser, scanPage, type PageScanResult } from "./scanner";

let shuttingDown = false;
let browser: Browser | null = null;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Reuse one Chromium instance across scans; relaunch if it crashed/disconnected. */
async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;
  if (browser) {
    try {
      await browser.close();
    } catch {
      /* already gone */
    }
  }
  browser = await launchBrowser();
  return browser;
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
  return data;
}

/**
 * Fail scans stuck in 'running' past the stale threshold — e.g. a worker that
 * crashed mid-job. Keyed off `last_progress_at` (the per-page heartbeat), NOT
 * `started_at`, so a long but healthy multi-page scan that keeps making
 * progress is never reaped. Idempotent and safe to run from multiple workers.
 */
async function reapStaleScans(): Promise<void> {
  const cutoff = new Date(Date.now() - env.staleScanMs).toISOString();
  const { error } = await supabase
    .from("scans")
    .update({
      status: "failed",
      error_reason: "Scan timed out — the worker did not finish in time. Try re-scanning.",
      finished_at: new Date().toISOString(),
    })
    .eq("status", "running")
    .lt("last_progress_at", cutoff);
  if (error) console.error("reapStaleScans failed:", error.message);
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

async function processScan(scan: Scan): Promise<void> {
  const urls = targetUrls(scan);
  if (urls.length === 0) {
    await finalize(scan.id, {
      status: "failed",
      error_reason: "No target URLs.",
      finished_at: new Date().toISOString(),
    });
    return;
  }

  const level = scan.wcag_level as WcagLevel;
  const scanOpts = { timeoutMs: env.pageTimeoutMs, maxNodes: env.maxNodesPerViolation };

  let pages: PageScanResult[];
  try {
    pages = [];
    for (const url of urls) {
      // Fetch the browser at the top of every iteration so a crash mid-scan is
      // transparently recovered for the *next* page, not just the retry path.
      let result = await scanPage(await getBrowser(), url, level, scanOpts);
      // Retry once on a hard failure with no HTTP response (transient).
      if (!result.ok && result.httpStatus === null) {
        result = await scanPage(await getBrowser(), url, level, scanOpts);
      }
      pages.push(result);
      // Heartbeat after each page so the stale-scan reaper leaves long scans alone.
      await heartbeat(scan.id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finalize(scan.id, {
      status: "failed",
      error_reason: `Browser error: ${message}`,
      finished_at: new Date().toISOString(),
    });
    console.error(`scan ${scan.id} browser error:`, message);
    return;
  }

  try {
    const summary = await persistResults(scan, pages);
    const status = summary.allFailed ? "failed" : summary.anyFailed ? "partial" : "completed";
    await finalize(scan.id, {
      status,
      score: summary.allFailed ? null : summary.score,
      totals: summary.totals,
      pages_scanned: summary.pagesScanned,
      error_reason: summary.allFailed ? (summary.firstError ?? "All pages failed.") : null,
      finished_at: new Date().toISOString(),
    });
    console.log(
      `scan ${scan.id} → ${status} (${summary.pagesScanned}/${pages.length} pages, score ${summary.score})`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finalize(scan.id, {
      status: "failed",
      error_reason: message,
      finished_at: new Date().toISOString(),
    });
    console.error(`scan ${scan.id} persistence error:`, message);
    // Persistence failures are unexpected (DB/bug) rather than normal scan
    // failures, so surface them for observability.
    captureError(err, { scanId: scan.id, scope: "persistResults" });
  }
}

async function loop(): Promise<void> {
  console.log("AccessAudit scan worker started. Polling for queued scans…");
  while (!shuttingDown) {
    await reapStaleScans();

    const scan = await claimScan();
    if (!scan) {
      await sleep(env.pollIntervalMs);
      continue;
    }
    console.log(`Claimed scan ${scan.id} (${scan.scan_type}, WCAG ${scan.wcag_level})`);
    await processScan(scan);
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

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received — finishing the current job, then exiting.`);
    shuttingDown = true;
  });
}

loop().catch(async (err) => {
  console.error("Fatal worker error:", err);
  captureError(err, { scope: "worker.loop" });
  await flushSentry();
  process.exit(1);
});
