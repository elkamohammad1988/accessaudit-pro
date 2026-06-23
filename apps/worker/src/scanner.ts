import { chromium, type Browser, type BrowserContext } from "playwright";
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
  opts: { timeoutMs: number; maxNodes: number },
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
