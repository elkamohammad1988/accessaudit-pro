import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { resendConfirmation, signIn } from "../actions";
import { AuthForm } from "@/components/auth/auth-form";
import { NoticeBanner } from "@/components/ui/notice-banner";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AccessAudit Pro workspace to run WCAG audits and manage reports.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  // `expired_link` → the confirmation/reset link is no longer valid (e.g.
  // otp_expired). Offer a one-click resend. `auth_callback` → a generic failure.
  const expired = error === "expired_link";
  const failed = error === "auth_callback";

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to your agency workspace.
        </p>
      </div>

      {expired ? (
        <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="flex items-start gap-2 text-sm font-medium text-warning-strong">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            That link has expired or was already used.
          </p>
          <p className="text-sm text-muted-foreground">
            Confirmation and reset links can only be used once. Enter your email and we&apos;ll send
            a fresh confirmation link.
          </p>
          <AuthForm
            action={resendConfirmation}
            submitLabel="Resend confirmation link"
            includePassword={false}
          />
        </div>
      ) : null}

      {failed ? (
        <NoticeBanner tone="error">
          We couldn&apos;t complete that link. Please sign in below, or request a new link.
        </NoticeBanner>
      ) : null}

      <AuthForm action={signIn} submitLabel="Sign in" next={next} />

      <div className="flex items-center justify-between text-sm">
        <Link href="/reset" className="underline-offset-4 hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="underline-offset-4 hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
