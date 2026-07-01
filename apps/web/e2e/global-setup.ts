import { createClient } from "@supabase/supabase-js";

/**
 * Seeds a clean, email-confirmed test user before the authenticated flow specs.
 *
 * Deleting any prior test user first guarantees each run starts from zero state
 * (the user's org/clients/projects/scans cascade away with it), so quota-bounded
 * flows (free tier = 1 client / 2 projects) are repeatable across CI runs.
 *
 * No-ops when the Supabase service-role key is absent — the authed specs then
 * skip (they gate on the same env var), so `public.spec.ts` still runs everywhere.
 */
export const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? "e2e@accessaudit.test";
export const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? "e2e-Password-123!";

export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log("[e2e] SUPABASE_SERVICE_ROLE_KEY not set — authenticated flows will skip.");
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Remove a prior test user so state is clean (FK cascades drop their data).
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users.find((u) => u.email === E2E_EMAIL);
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id);
  }

  const { error } = await admin.auth.admin.createUser({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    throw new Error(`[e2e] Failed to seed test user: ${error.message}`);
  }
  console.log(`[e2e] Seeded confirmed test user ${E2E_EMAIL}; authenticated flows enabled.`);
}
