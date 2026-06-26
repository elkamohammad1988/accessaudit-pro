import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * SSRF protection for the scanner. The worker drives a headless browser against
 * user-supplied URLs, so it must refuse anything that could reach internal
 * infrastructure (loopback, private ranges, link-local / cloud-metadata, etc.).
 *
 * Strategy:
 *  - reject non-http(s) and known-internal hostnames,
 *  - if the host is a literal IP, classify it directly,
 *  - otherwise resolve DNS and block if ANY resolved address is private.
 * `isBlockedRequestUrl` is a cheap, synchronous check used by the browser's
 * request interceptor as defense-in-depth against redirects / subresources to
 * literal private IPs.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === undefined || b === undefined) return true;
    if (a === 0) return true; // "this" network
    if (a === 10) return true; // private
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved / broadcast
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true; // loopback / unspecified
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    const mapped = lower.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped && mapped[1]) return isPrivateIp(mapped[1]); // IPv4-mapped IPv6
    return false;
  }

  return true; // not a valid IP we understand → block
}

/** Cheap synchronous gate for the browser request interceptor (literal IPs only). */
export function isBlockedRequestUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (net.isIP(host) && isPrivateIp(host)) return true;
  return false;
}

/** Resolve a hostname and report whether any address is private. Fails closed. */
async function resolvesToPrivate(host: string): Promise<boolean> {
  try {
    const records = await lookup(host, { all: true });
    if (records.length === 0) return true;
    return records.some((record) => isPrivateIp(record.address));
  } catch {
    return true;
  }
}

/**
 * Async interceptor gate that closes the DNS-rebinding hole the sync check leaves:
 * a *hostname* (not a literal IP) that resolves to a private address — via a
 * low-TTL rebind or a redirect to an internal domain — would otherwise slip past
 * `isBlockedRequestUrl`. This re-resolves every request's host (cached per scan)
 * and blocks if it points anywhere internal. Pass a Map to cache lookups.
 */
export async function isRequestUrlBlocked(
  rawUrl: string,
  cache?: Map<string, boolean>,
): Promise<boolean> {
  if (isBlockedRequestUrl(rawUrl)) return true;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true;
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (net.isIP(host)) return false; // literal IPs already cleared by the sync check

  const cached = cache?.get(host);
  if (cached !== undefined) return cached;

  const blocked = await resolvesToPrivate(host);
  cache?.set(host, blocked);
  return blocked;
}

/** Full async validation for the page we are about to navigate to. Throws if unsafe. */
export async function assertScannableUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Blocked protocol: ${url.protocol}`);
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error(`Blocked internal host: ${host}`);
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error(`Blocked private address: ${host}`);
    return;
  }

  const records = await lookup(host, { all: true });
  if (records.length === 0) {
    throw new Error(`Could not resolve host: ${host}`);
  }
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error(`Host ${host} resolves to a private address (${record.address}).`);
    }
  }
}
