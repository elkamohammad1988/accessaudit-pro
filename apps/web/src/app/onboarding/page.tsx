import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("metaTitle") };
}

// Reads the session — render per-request, never prerender.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { organization } = await requireSession();
  if (organization) {
    redirect("/dashboard");
  }
  const t = await getTranslations("onboarding");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* Onboarding renders outside the app shell (no sidebar), so surface the
       * theme switch here too. */}
      <ThemeToggle className="no-print absolute end-4 top-4 z-20 border bg-card/80 shadow-sm backdrop-blur-sm" />
      <main className="w-full max-w-sm space-y-6">
        <div className="space-y-4 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-fg shadow-sm"
          >
            A
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-md sm:p-6">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
