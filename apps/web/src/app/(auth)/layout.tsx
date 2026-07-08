import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuroraField } from "@/components/marketing/aurora-field";
import { getTranslations } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("auth.legalConsent");
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Living emerald aurora behind the card — drifting blobs + the assay rings,
          so the auth surface has real depth and light in both themes. */}
      <AuroraField anchor="right" />
      {/* Theme switch is reachable even before sign-in — signed-out visitors land
       * here directly, so the app-shell toggle in the sidebar isn't available. */}
      <ThemeToggle className="no-print absolute end-4 top-4 z-20 border border-white/60 bg-card/70 shadow-sm backdrop-blur-md dark:border-white/10" />
      <main className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
            <LogoMark aria-hidden="true" className="h-8 w-8 rounded-lg shadow-sm" />
            AccessAudit<span className="text-brand">&nbsp;Pro</span>
          </Link>
        </div>
        {/* Frosted-glass auth card — a floating pane with a lit top rim. */}
        <div className="lux-rim glass-panel p-5 sm:p-6">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t("lead")}{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            {t("terms")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            {t("privacy")}
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
