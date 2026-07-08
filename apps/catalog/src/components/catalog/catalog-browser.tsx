"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, PackageOpen, SlidersHorizontal, X } from "lucide-react";
import {
  emptyFilter,
  filterAndSort,
  isFilterActive,
  SORT_OPTIONS,
  type FilterState,
  type Product,
  type SortKey,
} from "@/data";
import { FiltersPanel } from "./filters-panel";
import { ProductGrid } from "./product-grid";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/locale-provider";

interface CatalogBrowserProps {
  base: Product[];
  hideCategoryFacet?: boolean;
  hideCollectionFacet?: boolean;
  initialSort?: SortKey;
  pageSize?: number;
}

function activeFilterCount(f: FilterState): number {
  return (
    f.categories.length +
    f.collections.length +
    f.colorways.length +
    f.badges.length +
    (f.minPrice != null || f.maxPrice != null ? 1 : 0) +
    (f.minRating != null ? 1 : 0) +
    (f.inStockOnly ? 1 : 0)
  );
}

export function CatalogBrowser({
  base,
  hideCategoryFacet,
  hideCollectionFacet,
  initialSort = "featured",
  pageSize = 12,
}: CatalogBrowserProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterState>(emptyFilter);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const patch = (p: Partial<FilterState>) => setFilter((f) => ({ ...f, ...p }));
  const clearAll = () => setFilter(emptyFilter);

  const results = useMemo(() => filterAndSort(base, filter, sort), [base, filter, sort]);

  // Reset to the first page whenever the result set changes shape.
  useEffect(() => setPage(1), [filter, sort, base]);

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const current = Math.min(page, pageCount);
  const paged = results.slice((current - 1) * pageSize, current * pageSize);
  const active = isFilterActive(filter);
  const activeCount = activeFilterCount(filter);

  // Lock body scroll while the mobile filter drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t("common.filters")}</h2>
            {active ? (
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-brand-deep hover:underline"
              >
                {t("common.clearAll")}
              </button>
            ) : null}
          </div>
          <FiltersPanel
            base={base}
            filter={filter}
            onChange={patch}
            hideCategoryFacet={hideCategoryFacet}
            hideCollectionFacet={hideCollectionFacet}
          />
        </div>
      </aside>

      {/* Results column */}
      <div className="min-w-0">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">{results.length}</span>{" "}
            {results.length === 1 ? "item" : "items"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-accent lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {t("common.filters")}
              {activeCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.6875rem] font-bold text-brand-fg">
                  {activeCount}
                </span>
              ) : null}
            </button>
            <div className="hidden sm:block">
              <Segmented
                ariaLabel="View"
                iconOnly
                value={view}
                onChange={setView}
                options={[
                  { value: "grid", label: t("common.grid"), icon: LayoutGrid },
                  { value: "list", label: t("common.list"), icon: List },
                ]}
              />
            </div>
            <label className="sr-only" htmlFor="sort">
              {t("common.sortBy")}
            </label>
            <Select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-[10.5rem]"
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
        </div>

        {/* Active facet chips */}
        {active ? (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 px-3 text-xs">
              <X className="h-3.5 w-3.5" aria-hidden /> {t("common.clearAll")}
            </Button>
            <span className="text-xs text-muted-foreground">{activeCount} active</span>
          </div>
        ) : null}

        {/* Results */}
        {paged.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={t("empty.catalogTitle")}
            body={t("empty.catalogBody")}
            action={
              active ? (
                <Button variant="outline" onClick={clearAll}>
                  {t("common.clearAll")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ProductGrid products={paged} view={view} />
            {pageCount > 1 ? (
              <Pagination
                page={current}
                pageCount={pageCount}
                onPageChange={(p) => {
                  setPage(p);
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-12"
              />
            ) : null}
          </>
        )}
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            aria-label="Close filters"
            className="absolute inset-0 animate-fade-in bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 flex w-[min(22rem,88vw)] animate-fade-in flex-col bg-popover shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">{t("common.filters")}</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FiltersPanel
                base={base}
                filter={filter}
                onChange={patch}
                hideCategoryFacet={hideCategoryFacet}
                hideCollectionFacet={hideCollectionFacet}
              />
            </div>
            <div className="flex items-center gap-3 border-t border-border p-4">
              <Button variant="secondary" onClick={clearAll} className="flex-1">
                {t("common.clearAll")}
              </Button>
              <Button onClick={() => setDrawerOpen(false)} className="flex-1">
                {t("common.apply")} ({results.length})
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
