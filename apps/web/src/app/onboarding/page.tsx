import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { LogoMark } from "@/components/brand/logo-mark";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Warm pigment washes — match the auth stage so signup → onboarding reads as
          one continuous sheet. Two still, faint stains (brass + clay); no drift, no
          bloom. Dark-mode only. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden dark:block">
        <div className="absolute left-1/2 top-[-16%] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.10),transparent_62%)] blur-2xl" />
        <div className="absolute bottom-[-18%] right-[4%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,hsl(var(--brand)/0.10),transparent_60%)] blur-3xl" />
      </div>
      {/* Onboarding renders outside the app shell (no sidebar), so surface the
       * theme switch here too. */}
      <ThemeToggle className="no-print absolute end-4 top-4 z-20 border bg-card/80 shadow-sm backdrop-blur-sm" />
      <main className="w-full max-w-sm space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-bold tracking-tight">
            <LogoMark aria-hidden="true" className="h-8 w-8 rounded-lg shadow-sm" />
            <span>
              AccessAudit<span className="text-brand">&nbsp;Pro</span>
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {/* Paper card — identical letterpress sheet to the auth card: a warm panel
            with a pressed top catch-light (`lux-rim`) and a soft warm shadow. */}
        <div className="lux-rim rounded-xl border border-border bg-card p-5 shadow-md sm:p-6">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
