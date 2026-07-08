import { cn, formatPrice } from "@/lib/utils";

interface PriceProps {
  price: number;
  compareAt?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

/** Price with optional strike-through original and a subtle savings note. */
export function Price({ price, compareAt, size = "md", className }: PriceProps) {
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold tabular-nums text-foreground", sizeMap[size])}>
        {formatPrice(price)}
      </span>
      {onSale ? (
        <span className="text-xs font-medium tabular-nums text-muted-foreground line-through">
          {formatPrice(compareAt)}
        </span>
      ) : null}
    </span>
  );
}

/** The percentage saved, e.g. "-18%" — used on sale badges. */
export function savingsPercent(price: number, compareAt: number): number {
  return Math.round(((compareAt - price) / compareAt) * 100);
}
