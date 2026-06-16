import { redirect } from "next/navigation";
import type { Organization, Profile } from "@accessaudit/database";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@accessaudit/database";

export interface SessionContext {
  userId: string;
  email: string | undefined;
  profile: Profile | null;
  /** The org this user owns (single-owner MVP). null until onboarding completes. */
  organization: Organization | null;
}

/**
 * Resolve the signed-in user plus their profile and owned organization, for use
 * in protected Server Components. Redirects to /login if there is no session.
 *
 * Uses getUser() (not getSession) so the token is verified against the auth
 * server — never trust an unverified session in server code.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: organization }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("organizations").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email,
    profile: profile ?? null,
    organization: organization ?? null,
  };
}

export interface OrgContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  organization: Organization;
}

/**
 * For Server Actions and mutations: resolve the signed-in user and their owned
 * organization, and hand back the Supabase client so the caller can reuse it for
 * the write. Redirects to /login when unauthenticated and /onboarding when the
 * user has no workspace yet — so callers can treat `organization` as guaranteed.
 */
export async function requireOrg(): Promise<OrgContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!organization) {
    redirect("/onboarding");
  }

  return { supabase, userId: user.id, organization };
}
