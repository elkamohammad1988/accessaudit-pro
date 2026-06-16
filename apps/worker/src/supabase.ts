import { createClient } from "@supabase/supabase-js";
import type { Database } from "@accessaudit/database";
import { env } from "./env";

/**
 * Service-role Supabase client. Bypasses RLS, so it can write scan_pages /
 * violations and update scans for any org. The worker must always derive
 * organization_id from the claimed scan row and never trust external input.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
