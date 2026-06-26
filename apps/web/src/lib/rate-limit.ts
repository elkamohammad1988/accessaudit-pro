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

/** Best-effort client IP from proxy headers (Vercel/most hosts set these). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
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
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * Never throws — on any infra error it returns true (allow).
 */
export async function allowRequest({
  action,
  identity,
  max,
  windowSeconds,
}: RateLimit): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: `${action}:${identity}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] rpc error:", error.message);
      return true;
    }
    return data !== false;
  } catch (err) {
    console.error("[rate-limit] failed:", err);
    return true;
  }
}

/** Convenience: rate-limit by current client IP. */
export async function allowByIp(
  action: string,
  limits: { max: number; windowSeconds: number },
): Promise<boolean> {
  return allowRequest({ action, identity: await clientIp(), ...limits });
}
