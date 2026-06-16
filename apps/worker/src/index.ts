import type { Scan } from "@accessaudit/database";
import type { WcagLevel } from "@accessaudit/shared";
import { env } from "./env";
import { supabase } from "./supabase";
import { persistResults } from "./persistence";
import { scanPage, withBrowser, type PageScanResult } from "./scanner";

let shuttingDown = false;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

async function finalize(scanId: string, patch: Partial<Scan>): Promise<void> {
  const { error } = await supabase.from("scans").update(patch).eq("id", scanId);
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
    pages = await withBrowser(async (browser) => {
      const results: PageScanResult[] = [];
      for (const url of urls) {
        let result = await scanPage(browser, url, level, scanOpts);
        // Retry once on a hard navigation failure (no HTTP response = transient).
        if (!result.ok && result.httpStatus === null) {
          result = await scanPage(browser, url, level, scanOpts);
        }
        results.push(result);
      }
      return results;
    });
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
  }
}

async function loop(): Promise<void> {
  console.log("AccessAudit scan worker started. Polling for queued scans…");
  while (!shuttingDown) {
    const scan = await claimScan();
    if (!scan) {
      await sleep(env.pollIntervalMs);
      continue;
    }
    console.log(`Claimed scan ${scan.id} (${scan.scan_type}, WCAG ${scan.wcag_level})`);
    await processScan(scan);
  }
  console.log("Worker stopped cleanly.");
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received — finishing the current job, then exiting.`);
    shuttingDown = true;
  });
}

loop().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});
