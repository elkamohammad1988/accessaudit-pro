import { Star } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

/** Five-star rating with a precise partial-fill on the last active star. */
export function Rating({ value, count, size = "sm", showValue = true, className }: RatingProps) {
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const label = `Rated ${formatRating(value)} out of 5${count != null ? `, ${count} reviews` : ""}`;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative inline-flex" role="img" aria-label={label}>
        <span className="flex text-border" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={px} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-brand"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={cn(px, "shrink-0")} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
      </span>
      {showValue ? (
        <span className="text-xs font-medium text-muted-foreground">
          {formatRating(value)}
          {count != null ? <span className="tabular-nums"> ({count})</span> : null}
        </span>
      ) : null}
    </span>
  );
}
