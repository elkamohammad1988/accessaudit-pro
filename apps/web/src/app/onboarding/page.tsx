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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Create your workspace</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            This is your agency&apos;s home. You can change branding later.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
