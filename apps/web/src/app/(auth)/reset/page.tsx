import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a password-reset link for your AccessAudit Pro account.",
  robots: { index: false, follow: true },
};

export default function ResetPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a link to set a new one.
        </p>
      </div>

      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        includePassword={false}
      />

      <p className="text-center text-sm">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
