import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@accessaudit/database";
import { assertPublicEnv, isDemoMode } from "@/lib/env";
import { createMockClient } from "@/lib/demo/mock-client";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth cookies via next/headers. In Next 15 `cookies()` is async.
 * With no Supabase project configured, returns the local mock client (demo mode).
 */
export async function createClient() {
  if (isDemoMode()) return createMockClient();
  const { supabaseUrl, supabaseAnonKey } = assertPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore — middleware refreshes the session cookie.
        }
      },
    },
  });
}
