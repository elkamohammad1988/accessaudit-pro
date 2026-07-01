import { Skeleton } from "@/components/ui/skeleton";
import { SrLoading } from "@/components/ui/sr-loading";

/** List-shaped skeleton matching the clients index that follows. */
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-2 rounded-lg border p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
      <SrLoading />
    </div>
  );
}
