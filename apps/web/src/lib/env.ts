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
