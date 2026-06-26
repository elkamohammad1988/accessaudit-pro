import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata: Metadata = { title: "Create your workspace" };

// Reads the session — render per-request, never prerender.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { organization } = await requireSession();
  if (organization) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-spotlight relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-64 w-full max-w-md rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(50%_40%_at_50%_20%,black,transparent)]"
      />
      <main className="w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-lg font-bold text-brand-fg shadow-md ring-1 ring-inset ring-white/15"
          >
            A
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Create your workspace</h1>
            <p className="text-sm text-muted-foreground">
              This is your agency&apos;s home. You can change branding later.
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-lg sm:p-8">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
