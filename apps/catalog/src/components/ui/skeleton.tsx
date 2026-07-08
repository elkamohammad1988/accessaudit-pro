import { cn } from "@/lib/utils";

/** A shimmering placeholder block. Compose these to mirror real content layout. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-black/[0.04] after:to-transparent",
        "dark:after:via-white/[0.05]",
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}

/** A card placeholder that matches the product-card footprint. */
export function ProductCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

/** A grid of product skeletons for loading states. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
