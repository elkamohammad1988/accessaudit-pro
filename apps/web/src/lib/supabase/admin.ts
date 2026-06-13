import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@accessaudit/database";
import { assertPublicEnv, serverEnv } from "@/lib/env";

/**
 * Service-role client — BYPASSES RLS. Server-only (the `server-only` import makes
 * it a build error to import from a Client Component). Use sparingly: webhook
 * handlers and trusted server jobs. Never derive tenant scope from user input.
 */
export function createAdminClient() {
  const { supabaseUrl } = assertPublicEnv();
  const { serviceRoleKey } = serverEnv();
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
