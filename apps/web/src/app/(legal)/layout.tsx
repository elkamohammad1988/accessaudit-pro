import Link from "next/link";

/**
 * Shared shell for the public legal pages (/terms, /privacy). Plain prose with a
 * back-to-home header and cross-links. These routes are whitelisted in the
 * middleware so signed-out visitors can read them.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <Link href="/" className="text-sm font-semibold">
          AccessAudit<span className="text-brand"> Pro</span>
        </Link>
      </header>

      <main>
        <article className="space-y-4 text-sm leading-relaxed text-[hsl(var(--foreground))] [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-medium [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
          {children}
        </article>
      </main>

      <footer className="mt-12 flex flex-wrap gap-4 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/">Home</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/accessibility">Accessibility</Link>
      </footer>
    </div>
  );
}
