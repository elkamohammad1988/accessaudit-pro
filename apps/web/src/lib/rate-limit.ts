import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Durable rate limiting backed by the `check_rate_limit` Postgres RPC.
 *
 * Why DB-backed and not in-memory: the web app runs on serverless instances that
 * don't share memory, so an in-process counter is bypassed simply by landing on a
 * different instance. A single atomic upsert in Postgres is the simplest store
 * that actually holds across instances without adding Redis to the MVP.
 *
 * Everything here fails OPEN: the limiter is an abuse guardrail, not an
 * availability dependency, so a DB hiccup (or missing service-role key in local
 * dev) must never lock real users out.
 */

/**
 * Client IP derived from a TRUSTED hop, not the spoofable left-most value.
 *
 * `x-forwarded-for` is `client, proxy1, proxy2, …`: the left-most entry is set by
 * the client and trivially forged to get a fresh bucket per request, defeating
 * the limiter. We therefore prefer `x-real-ip` (set by the platform edge and not
 * client-controllable on Vercel/most hosts) and otherwise take the RIGHT-most XFF
 * hop (added by the closest trusted proxy).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }
  return "unknown";
}

export interface RateLimit {
  /** Stable bucket name, e.g. "auth:signin". */
  action: string;
  /** Identity within the bucket — an IP, org id, or user id. */
  identity: string;
  /** Max requests allowed per window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /**
   * On an infra error, deny instead of allow. Use for auth buckets (login,
   * signup, reset): brute-force protection that silently disappears on a DB blip
   * is worse than a brief deny — and auth needs the DB anyway, so a deny here is
   * not a new outage. Defaults false (fail-open) for non-security guardrails.
   */
  failClosed?: boolean;
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * On an infra error it fails open (allow) unless `failClosed` is set.
 */
export async function allowRequest({
  action,
  identity,
  max,
  windowSeconds,
  failClosed = false,
}: RateLimit): Promise<boolean> {
  const onError = () => !failClosed;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: `${action}:${identity}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] rpc error:", error.message);
      return onError();
    }
    return data !== false;
  } catch (err) {
    console.error("[rate-limit] failed:", err);
    return onError();
  }
}

/** Convenience: rate-limit by current client IP. */
export async function allowByIp(
  action: string,
  limits: { max: number; windowSeconds: number; failClosed?: boolean },
): Promise<boolean> {
  return allowRequest({ action, identity: await clientIp(), ...limits });
}
