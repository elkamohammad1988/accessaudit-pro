"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@accessaudit/database";
import { assertPublicEnv } from "@/lib/env";

/** Supabase client for Client Components (runs in the browser, anon key). */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = assertPublicEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
