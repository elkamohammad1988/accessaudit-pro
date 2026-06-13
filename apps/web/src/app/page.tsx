import Link from "next/link";

// Signed-in visitors are redirected to /dashboard by middleware; this renders
// for signed-out visitors only.
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          WCAG 2.2 · EAA / EN 301 549
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Accessibility audits your clients can actually read.
        </h1>
        <p className="mx-auto max-w-xl text-[hsl(var(--muted-foreground))]">
          Scan any site, get a prioritized WCAG report, and hand over a
          white-labeled deliverable — built for agencies, not just developers.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
        >
          Start free
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
