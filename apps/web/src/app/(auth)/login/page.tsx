import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "../actions";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AccessAudit Pro workspace to run WCAG audits and manage reports.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to your agency workspace.
        </p>
      </div>

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
