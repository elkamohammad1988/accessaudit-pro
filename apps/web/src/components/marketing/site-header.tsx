import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Top navigation for the public marketing surface (landing, pricing, guides). */
export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-brand-fg shadow-sm ring-1 ring-inset ring-white/15"
          >
            A
          </span>
          AccessAudit<span className="text-brand">&nbsp;Pro</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/guides"
            className="hidden rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-block"
          >
            Guides
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign in
          </Link>
          <ThemeToggle className="hidden sm:inline-flex" />
          <ButtonLink href="/signup" size="sm" className="h-9 px-4">
            Start free
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
