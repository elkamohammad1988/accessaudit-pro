import type { Metadata } from "next";
import { Home, Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {/* Soft brand glow behind the content for depth. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-64 w-64 rounded-full bg-brand/15 blur-3xl"
      />
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <ButtonLink href="/" className="mt-2">
        <Home className="h-4 w-4" aria-hidden="true" />
        Back to home
      </ButtonLink>
    </main>
  );
}
