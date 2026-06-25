import Link from "next/link";

/** Top navigation for the public marketing surface (landing + pricing). */
export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold">
          AccessAudit<span className="text-brand"> Pro</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
          <Link href="/guides" className="hidden font-medium underline-offset-4 hover:underline sm:inline">
            Guides
          </Link>
          <Link href="/pricing" className="font-medium underline-offset-4 hover:underline">
            Pricing
          </Link>
          <Link href="/login" className="font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 font-medium text-brand-fg transition-opacity hover:opacity-90"
          >
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}
