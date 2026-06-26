import { Skeleton } from "@/components/ui/skeleton";

/** Report-shaped skeleton matching the scan report that follows. */
export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
