import Link from "next/link";

/** Shared footer for the public marketing surface. */
export function SiteFooter() {
  return (
    <footer className="space-y-3 border-t py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
      <p>
        AccessAudit<span className="text-brand"> Pro</span> · WCAG 2.2 accessibility audits for
        agencies
      </p>
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-4">
        <Link href="/pricing" className="underline-offset-4 hover:underline">
          Pricing
        </Link>
        <Link href="/terms" className="underline-offset-4 hover:underline">
          Terms
        </Link>
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>
        <Link href="/login" className="underline-offset-4 hover:underline">
          Sign in
        </Link>
      </nav>
    </footer>
  );
}
