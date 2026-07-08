import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { getTranslations } from "@/i18n/server";

const FOOTER_LINKS = [
  { href: "/pricing", key: "pricing" },
  { href: "/sample", key: "sample" },
  { href: "/guides", key: "guides" },
  { href: "/terms", key: "terms" },
  { href: "/privacy", key: "privacy" },
  { href: "/accessibility", key: "accessibility" },
  { href: "/login", key: "signIn" },
] as const;

/** Shared footer for the public marketing surface. */
export async function SiteFooter() {
  const t = await getTranslations("nav");
  const year = new Date().getFullYear();
  return (
    <footer className="lux-rim relative mt-8 border-t">
      <div className="mx-auto max-w-6xl space-y-5 px-6 py-12 text-center text-sm text-muted-foreground">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-foreground"
        >
          <LogoMark
            aria-hidden="true"
            className="h-6 w-6 rounded-md transition-transform duration-300 group-hover:-rotate-3 dark:shadow-[0_0_14px_-4px_hsl(var(--brand)/0.6)]"
          />
          <span className="font-display text-lg font-semibold tracking-tight">
            AccessAudit<span className="text-brand dark:text-gold-strong">&nbsp;Pro</span>
          </span>
        </Link>
        <p className="mx-auto font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
          WCAG 2.2 · EN 301 549 · axe-core
        </p>
        <nav aria-label={t("footer")} className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t(`footerLinks.${link.key}`)}
            </Link>
          ))}
        </nav>
        <p className="text-xs">{t("copyright", { year: String(year) })}</p>
      </div>
    </footer>
  );
}
