export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-[hsl(var(--muted))]" />
      <div className="h-32 w-full animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
      <div className="h-32 w-full animate-pulse rounded-lg bg-[hsl(var(--muted))]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
