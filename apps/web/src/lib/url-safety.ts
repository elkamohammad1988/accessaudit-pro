/**
 * Shared URL normalization + a fast, best-effort internal-host check used by the
 * web app for early validation. The authoritative SSRF guard (DNS resolution +
 * private-IP classification) lives in the worker (apps/worker/src/url-guard.ts);
 * this is the cheap first line that keeps obviously-internal targets out of the
 * queue and gives the user immediate feedback.
 */

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /^metadata(\.google\.internal)?$/i,
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^::1$/,
  /^fe80:/i,
  /^f[cd][0-9a-f]{2}:/i,
];

export function isLikelyInternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return PRIVATE_HOST_PATTERNS.some((re) => re.test(host));
}

/**
 * Accept URLs with or without a scheme; default to https. Returns the normalized
 * absolute URL, or null if it can't be parsed into a public host.
 */
export function normalizeScanUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Need a real host: a dot (domain/IPv4) or a colon (IPv6 literal).
  if (!url.hostname.includes(".") && !url.hostname.includes(":")) return null;
  if (isLikelyInternalHost(url.hostname)) return null;
  return url.toString();
}
