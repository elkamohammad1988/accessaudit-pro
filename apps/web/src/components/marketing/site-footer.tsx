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
    <footer className="border-t">
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
          <LogoMark aria-hidden="true" className="h-6 w-6 rounded-md" />
          AccessAudit<span className="text-brand">&nbsp;Pro</span>
        </Link>
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
