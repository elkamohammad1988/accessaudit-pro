import { type NextRequest } from "next/server";
import { completeAuthRedirect } from "@/lib/supabase/confirm";

export const dynamic = "force-dynamic";

/**
 * Redirect target for email links that carry a `token_hash` + `type` (signup
 * confirmation, magic link, password recovery). The email templates point here;
 * the shared handler calls `verifyOtp()` to establish the session.
 */
export async function GET(request: NextRequest) {
  return completeAuthRedirect(request);
}
