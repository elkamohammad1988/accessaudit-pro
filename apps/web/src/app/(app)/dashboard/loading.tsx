import { Skeleton } from "@/components/ui/skeleton";
import { SrLoading } from "@/components/ui/sr-loading";

/**
 * Dashboard skeleton — mirrors the Jumbo-style layout (KPI tile row, trend +
 * severity, usage + recent scans) so the highest-traffic page paints structure
 * instantly and content swaps in with no layout shift while its six queries resolve.
 */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Trend + severity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
          <Skeleton className="mt-5 h-[200px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <div className="mt-5 flex flex-col items-center gap-5">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
            <div className="grid w-full grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage + recent scans */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-28" />
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
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3">
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
      </div>

      <SrLoading />
    </div>
  );
}
