import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your AccessAudit Pro account.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// Reached via the reset-password email link → /auth/callback exchanges the code
// for a session → here. Requires that session to set a new password.
export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for {user.email}.
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
