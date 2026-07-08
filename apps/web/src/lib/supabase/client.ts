"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@accessaudit/database";
import { assertPublicEnv, isDemoMode } from "@/lib/env";
import { createMockClient } from "@/lib/demo/mock-client";

/** Supabase client for Client Components (runs in the browser, anon key). With no
 *  Supabase project configured, returns the local mock client (demo mode). */
export function createClient() {
  if (isDemoMode()) return createMockClient();
  const { supabaseUrl, supabaseAnonKey } = assertPublicEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
