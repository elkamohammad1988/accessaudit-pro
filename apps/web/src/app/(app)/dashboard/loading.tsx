import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard skeleton — mirrors the real layout (score hero + usage, quick stats,
 * recent scans) so the highest-traffic page paints structure instantly and the
 * content swaps in with no layout shift while its six queries resolve.
 */
export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Score hero + usage meters */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm lg:col-span-2">
          <Skeleton className="h-4 w-48" />
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="h-[132px] w-[132px] rounded-full" />
            <div className="w-full flex-1 space-y-3">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>
        <div className="space-y-5 rounded-lg border bg-card p-6 shadow-sm">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Recent scans */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="divide-y rounded-lg border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
