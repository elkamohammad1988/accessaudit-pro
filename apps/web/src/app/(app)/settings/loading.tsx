import { Skeleton } from "@/components/ui/skeleton";

/** Section-shaped skeleton matching the settings page that follows. */
export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-lg border p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
