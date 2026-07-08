"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Build a compact page list with ellipses: 1 … 4 5 [6] 7 8 … 20 */
function pageList(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const items = pageList(page, pageCount);

  const arrow =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand/40 hover:bg-accent disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav
      className={cn("flex items-center justify-center gap-1.5", className)}
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={arrow}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              item === page
                ? "bg-brand text-brand-fg shadow-sm"
                : "text-foreground hover:bg-accent",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className={arrow}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
