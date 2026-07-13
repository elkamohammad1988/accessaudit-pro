/**
 * Environment access. We intentionally do NOT throw at module import time, so
 * `next build` succeeds without secrets present; instead we assert lazily where
 * a value is actually required at request time.
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/**
 * Demo mode — the app runs entirely on the local in-memory dataset (lib/demo):
 * `createClient`, `createAdminClient` and the browser client all return a mock
 * Supabase client, and the middleware skips auth routing.
 *
 * FAIL CLOSED: demo mode disables authentication, so it must be an *explicit*
 * opt-in — never the silent consequence of a missing secret. An explicit
 * `NEXT_PUBLIC_DEMO_MODE` flag wins in both directions. With the flag unset we
 * infer demo from the absence of a Supabase URL *only outside production*, for
 * zero-config local dev; a production deploy that loses its Supabase env then
 * fails closed (assertPublicEnv throws) instead of degrading to a single shared,
 * unauthenticated tenant. All three inputs (the two `NEXT_PUBLIC_*` vars and
 * `NODE_ENV`) are inlined by Next at build time, so this resolves identically on
 * server and client.
 */
export function isDemoMode(): boolean {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  // Unset flag: infer from config only in non-production. In production the
  // absence of a backend must break loudly, not silently disable auth.
  if (process.env.NODE_ENV === "production") return false;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * The app's public origin — used for canonical URLs, OG tags, the sitemap,
 * Stripe redirect URLs, and auth email links. `NEXT_PUBLIC_APP_URL` is inlined
 * at build time, so a missing value silently poisons every absolute URL with
 * `localhost`. We therefore FAIL LOUDLY in production rather than fall back: a
 * misconfigured deploy should break the build, not ship an un-indexable site
 * with broken billing redirects. In dev it falls back to localhost.
 */
export function appBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, "");
  // Demo mode has no configured origin by design — fall back to localhost so the
  // app builds and runs with zero env (rather than failing the production build).
  if (isDemoMode()) return "http://localhost:3000";
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required in production. Set it to the deployed origin " +
        "(e.g. https://app.accessauditpro.com); it backs canonical URLs, OG tags, the " +
        "sitemap, Stripe redirects, and auth email links.",
    );
  }
  return "http://localhost:3000";
}

export function assertPublicEnv(): { supabaseUrl: string; supabaseAnonKey: string } {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in the keys from `supabase start`.",
    );
  }
  return { supabaseUrl: publicEnv.supabaseUrl, supabaseAnonKey: publicEnv.supabaseAnonKey };
}

/** Server-only: the service-role key bypasses RLS. Never import this client-side. */
export function serverEnv(): { serviceRoleKey: string } {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server-only).");
  }
  return { serviceRoleKey };
}
