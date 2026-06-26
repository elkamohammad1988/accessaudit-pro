import { chromium, type Browser, type BrowserContext } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import type { ImpactLevel, WcagLevel } from "@accessaudit/shared";
import { tagsForLevel } from "./wcag";
import { assertScannableUrl, isRequestUrlBlocked } from "./url-guard";

/** Reject a promise that doesn't settle within `ms`, so nothing can hang forever. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    timer.unref?.();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export interface AxeViolationLite {
  ruleId: string;
  impact: ImpactLevel;
  wcagTags: string[];
  description: string | null;
  help: string | null;
  helpUrl: string | null;
  nodes: { target: string[]; html: string; failureSummary: string }[];
}

export interface PageScanResult {
  url: string;
  ok: boolean;
  httpStatus: number | null;
  error?: string;
  violations: AxeViolationLite[];
}

/** Launch a Chromium instance. Reused across scans by the worker (see index.ts). */
export function launchBrowser(): Promise<Browser> {
  // --no-sandbox / --disable-dev-shm-usage are required in most container hosts.
  return chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
}

function errorResult(url: string, err: unknown): PageScanResult {
  return {
    url,
    ok: false,
    httpStatus: null,
    error: err instanceof Error ? err.message : String(err),
    violations: [],
  };
}

export async function scanPage(
  browser: Browser,
  url: string,
  level: WcagLevel,
  opts: { timeoutMs: number; maxNodes: number; settleMs: number },
): Promise<PageScanResult> {
  // SSRF gate: validate (and DNS-resolve) the target before we touch the network.
  try {
    await assertScannableUrl(url);
  } catch (err) {
    return errorResult(url, err);
  }

  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext();
    const page = await context.newPage();

    // Defense-in-depth: abort any request (navigation, redirects, subresources)
    // that resolves to a private/blocked address — including hostnames that rebind
    // to internal IPs, which the literal-IP check alone would miss. Cached per scan.
    const dnsCache = new Map<string, boolean>();
    await context.route("**/*", async (route) => {
      if (await isRequestUrlBlocked(route.request().url(), dnsCache)) {
        await route.abort("blockedbyclient");
      } else {
        await route.continue();
      }
    });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: opts.timeoutMs,
    });
    const httpStatus = response?.status() ?? null;
    if (httpStatus !== null && httpStatus >= 400) {
      return { url, ok: false, httpStatus, error: `HTTP ${httpStatus}`, violations: [] };
    }

    // Let client-rendered (SPA) content settle before auditing, but never block
    // the scan on a page that streams forever (analytics beacons, open sockets):
    // wait for network idle only up to a short, bounded budget, then proceed.
    await page
      .waitForLoadState("networkidle", { timeout: opts.settleMs })
      .catch(() => {
        /* not idle within budget — audit what rendered anyway */
      });

    // axe has no built-in timeout — a pathological DOM could hang it indefinitely
    // and wedge the single-threaded worker, so bound it explicitly.
    const results = await withTimeout(
      new AxeBuilder({ page }).withTags(tagsForLevel(level)).analyze(),
      opts.timeoutMs,
      "Accessibility analysis",
    );
    const violations: AxeViolationLite[] = results.violations.map((v) => ({
      ruleId: v.id,
      impact: (v.impact ?? "minor") as ImpactLevel,
      wcagTags: v.tags ?? [],
      description: v.description ?? null,
      help: v.help ?? null,
      helpUrl: v.helpUrl ?? null,
      nodes: v.nodes.slice(0, opts.maxNodes).map((n) => ({
        target: n.target.map((t) => String(t)),
        html: n.html,
        failureSummary: n.failureSummary ?? "",
      })),
    }));

    return { url, ok: true, httpStatus, violations };
  } catch (err) {
    return errorResult(url, err);
  } finally {
    if (context) {
      try {
        await context.close();
      } catch {
        // browser may have died; the caller relaunches it.
      }
    }
  }
}
