import { chromium, type Browser } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import type { ImpactLevel, WcagLevel } from "@accessaudit/shared";
import { tagsForLevel } from "./wcag";
import { assertScannableUrl, isBlockedRequestUrl } from "./url-guard";

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

/** Launch a single Chromium instance for the whole scan, then dispose it. */
export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  // --no-sandbox is required in most container hosts (Railway/Render/Docker).
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

export async function scanPage(
  browser: Browser,
  url: string,
  level: WcagLevel,
  opts: { timeoutMs: number; maxNodes: number },
): Promise<PageScanResult> {
  try {
    // SSRF gate: validate (and DNS-resolve) the target before we touch the network.
    await assertScannableUrl(url);
  } catch (err) {
    return {
      url,
      ok: false,
      httpStatus: null,
      error: err instanceof Error ? err.message : "Blocked URL.",
      violations: [],
    };
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    // Defense-in-depth: abort any request (redirects, subresources) to a literal
    // private address or blocked host that slips past the pre-navigation check.
    await context.route("**/*", (route) => {
      if (isBlockedRequestUrl(route.request().url())) {
        void route.abort("blockedbyclient");
      } else {
        void route.continue();
      }
    });

    const response = await page.goto(url, { waitUntil: "load", timeout: opts.timeoutMs });
    const httpStatus = response?.status() ?? null;
    if (httpStatus !== null && httpStatus >= 400) {
      return { url, ok: false, httpStatus, error: `HTTP ${httpStatus}`, violations: [] };
    }

    const results = await new AxeBuilder({ page }).withTags(tagsForLevel(level)).analyze();
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
    return {
      url,
      ok: false,
      httpStatus: null,
      error: err instanceof Error ? err.message : String(err),
      violations: [],
    };
  } finally {
    await context.close();
  }
}
