"use client";

import type { Product } from "@/data/types";
import { ProductCard } from "./product-card";
import { usePreferences } from "@/components/providers/preferences-provider";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  view?: "grid" | "list";
  className?: string;
}

export function ProductGrid({ products, view = "grid", className }: ProductGridProps) {
  const { density } = usePreferences();

  if (view === "list") {
    return (
      <div className={cn("flex flex-col gap-3 sm:gap-4", className)}>
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} view="list" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5",
        density === "compact"
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} view="grid" />
      ))}
    </div>
  );
}
