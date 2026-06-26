import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-spotlight relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Ambient brand glow + faint dot grid for depth behind the auth card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-64 w-full max-w-md rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(50%_40%_at_50%_20%,black,transparent)]"
      />
      <main className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-brand-fg shadow-sm ring-1 ring-inset ring-white/15"
            >
              A
            </span>
            AccessAudit<span className="text-brand">&nbsp;Pro</span>
          </Link>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-lg sm:p-8">{children}</div>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
