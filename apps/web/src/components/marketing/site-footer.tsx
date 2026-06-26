import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/sample", label: "Sample report" },
  { href: "/guides", label: "Guides" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/login", label: "Sign in" },
] as const;

/** Shared footer for the public marketing surface. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t">
      {/* Hairline brand accent across the top of the footer. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent"
      />
      <div className="mx-auto max-w-5xl space-y-4 px-6 py-10 text-center text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-2 text-xs font-bold text-brand-fg ring-1 ring-inset ring-white/15"
          >
            A
          </span>
          AccessAudit<span className="text-brand">&nbsp;Pro</span>
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs">
          © {year} AccessAudit Pro · WCAG 2.2 accessibility audits for agencies
        </p>
      </div>
    </footer>
  );
}
