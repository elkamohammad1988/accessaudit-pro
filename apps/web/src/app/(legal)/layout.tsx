import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getTranslations } from "@/i18n/server";

/**
 * Shared shell for the public legal pages (/terms, /privacy). Plain prose with a
 * back-to-home header and cross-links. These routes are whitelisted in the
 * middleware so signed-out visitors can read them.
 */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("legal.layout");
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-fg"
      >
        {t("skipToContent")}
      </a>
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold">
          AccessAudit<span className="text-brand"> Pro</span>
        </Link>
        <ThemeToggle className="no-print" />
      </header>

      <main id="main-content" tabIndex={-1}>
        <article className="space-y-4 text-sm leading-relaxed text-[hsl(var(--foreground))] [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-medium [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-6 [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          {children}
        </article>
      </main>

      <footer className="mt-10 flex flex-wrap gap-3 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/">{t("home")}</Link>
        <Link href="/terms">{t("terms")}</Link>
        <Link href="/privacy">{t("privacy")}</Link>
        <Link href="/accessibility">{t("accessibility")}</Link>
      </footer>
    </div>
  );
}
