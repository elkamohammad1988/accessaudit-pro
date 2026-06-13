import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "../actions";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Free to start — no card required.
        </p>
      </div>

      <AuthForm action={signUp} submitLabel="Create account" />

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
