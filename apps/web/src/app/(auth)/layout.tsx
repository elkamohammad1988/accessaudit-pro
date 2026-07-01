import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getTranslations } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("auth.legalConsent");
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* Theme switch is reachable even before sign-in — signed-out visitors land
       * here directly, so the app-shell toggle in the sidebar isn't available. */}
      <ThemeToggle className="no-print absolute end-4 top-4 z-20 border bg-card/80 shadow-sm backdrop-blur-sm" />
      <main className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
            <LogoMark
              aria-hidden="true"
              className="h-8 w-8 rounded-lg shadow-sm dark:shadow-[0_0_18px_-3px_hsl(var(--brand)/0.6)]"
            />
            AccessAudit<span className="text-brand">&nbsp;Pro</span>
          </Link>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-md sm:p-6">{children}</div>
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
