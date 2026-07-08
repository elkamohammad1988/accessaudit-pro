import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getTranslations } from "@/i18n/server";
import { isDemoMode } from "@/lib/env";

/** Top navigation for the public marketing surface (landing, pricing, guides). */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  // In the local showcase there's no auth wall — both CTAs drop straight into the
  // signed-in demo app instead of the sign-in / sign-up flow.
  const demo = isDemoMode();
  const signInHref = demo ? "/dashboard" : "/login";
  const startHref = demo ? "/dashboard" : "/signup";
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark
            aria-hidden="true"
            className="h-7 w-7 rounded-lg shadow-sm transition-transform duration-300 group-hover:-rotate-3"
          />
          AccessAudit<span className="text-brand">&nbsp;Pro</span>
        </Link>
        <nav aria-label={t("primary")} className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/guides"
            className="hidden rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
          >
            {t("marketing.guides")}
          </Link>
          <Link
            href="/pricing"
            className="hidden rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
          >
            {t("marketing.pricing")}
          </Link>
          <Link
            href={signInHref}
            className="rounded-md px-2 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
          >
            {t("marketing.signIn")}
          </Link>
          <LanguageSwitcher className="hidden sm:block" />
          {/* Desktop-only: the mobile header is space-constrained and long locale
           * strings (ar/zh) would overflow it. Mobile marketing still follows the
           * OS dark-mode preference, and every signed-in/auth surface has the
           * toggle, so a manual switch is reachable as soon as the user acts. */}
          <ThemeToggle className="hidden sm:inline-flex" />
          <Magnetic strength={0.25}>
            <ButtonLink href={startHref} size="sm" className="h-9 px-4">
              {t("marketing.startFree")}
            </ButtonLink>
          </Magnetic>
        </nav>
      </div>
    </header>
  );
}
