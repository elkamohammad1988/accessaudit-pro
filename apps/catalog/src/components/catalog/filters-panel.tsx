"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import type { FilterState, Product, ProductBadge } from "@/data";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { allColorways } from "@/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RangeSlider } from "@/components/ui/range-slider";
import { cn, formatPrice } from "@/lib/utils";

interface FiltersPanelProps {
  base: Product[];
  filter: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  hideCategoryFacet?: boolean;
  hideCollectionFacet?: boolean;
}

const BADGES: { key: ProductBadge; label: string }[] = [
  { key: "new", label: "New" },
  { key: "bestseller", label: "Bestseller" },
  { key: "sale", label: "On sale" },
  { key: "limited", label: "Limited" },
];

const RATINGS = [
  { value: 4.5, label: "4.5 & up" },
  { value: 4, label: "4.0 & up" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FacetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function FiltersPanel({
  base,
  filter,
  onChange,
  hideCategoryFacet,
  hideCollectionFacet,
}: FiltersPanelProps) {
  const bounds = useMemo(() => {
    const prices = base.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [base]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of base) m.set(p.categorySlug, (m.get(p.categorySlug) ?? 0) + 1);
    return m;
  }, [base]);

  const colCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of base) for (const c of p.collectionSlugs) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  }, [base]);

  const colors = useMemo(() => allColorways(base), [base]);

  const lo = filter.minPrice ?? bounds.min;
  const hi = filter.maxPrice ?? bounds.max;

  return (
    <div>
      {!hideCategoryFacet ? (
        <FacetSection title="Department">
          <div className="-mx-2 space-y-0.5">
            {categories
              .filter((c) => catCounts.has(c.slug))
              .map((c) => (
                <Checkbox
                  key={c.slug}
                  checked={filter.categories.includes(c.slug)}
                  onChange={() => onChange({ categories: toggle(filter.categories, c.slug) })}
                  label={c.name}
                  count={catCounts.get(c.slug)}
                />
              ))}
          </div>
        </FacetSection>
      ) : null}

      <FacetSection title="Price">
        <div className="px-1 pt-1">
          <RangeSlider
            min={bounds.min}
            max={bounds.max}
            step={1000}
            value={[lo, hi]}
            onChange={([nlo, nhi]) =>
              onChange({
                minPrice: nlo <= bounds.min ? null : nlo,
                maxPrice: nhi >= bounds.max ? null : nhi,
              })
            }
            ariaLabelMin="Minimum price"
            ariaLabelMax="Maximum price"
          />
          <div className="mt-3 flex items-center justify-between text-sm font-medium tabular-nums text-muted-foreground">
            <span>{formatPrice(lo)}</span>
            <span>{formatPrice(hi)}</span>
          </div>
        </div>
      </FacetSection>

      {colors.length > 1 ? (
        <FacetSection title="Colour">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const active = filter.colorways.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onChange({ colorways: toggle(filter.colorways, c.name) })}
                  aria-pressed={active}
                  title={c.name}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-brand bg-brand/10 text-brand-deep"
                      : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: `hsl(${c.hue} ${c.sat}% ${c.light}%)` }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        </FacetSection>
      ) : null}

      <FacetSection title="Rating">
        <div className="flex flex-col gap-1">
          {RATINGS.map((r) => {
            const active = filter.minRating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange({ minRating: active ? null : r.value })}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  active && "bg-accent",
                )}
              >
                <span className="flex text-brand">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      fill={i < Math.floor(r.value) ? "currentColor" : "none"}
                      strokeWidth={i < Math.floor(r.value) ? 0 : 1.5}
                    />
                  ))}
                </span>
                <span className={cn(active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {r.label}
                </span>
              </button>
            );
          })}
        </div>
      </FacetSection>

      <FacetSection title="Highlights">
        <div className="flex flex-wrap gap-2">
          {BADGES.map((b) => {
            const active = filter.badges.includes(b.key);
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => onChange({ badges: toggle(filter.badges, b.key) })}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-brand bg-brand/10 text-brand-deep"
                    : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
                )}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </FacetSection>

      <FacetSection title="Availability">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-foreground">In stock only</span>
          <Switch
            checked={filter.inStockOnly}
            onChange={(v) => onChange({ inStockOnly: v })}
            label="In stock only"
          />
        </label>
      </FacetSection>

      {!hideCollectionFacet && colCounts.size > 0 ? (
        <FacetSection title="Collection">
          <div className="-mx-2 space-y-0.5">
            {collections
              .filter((c) => colCounts.has(c.slug))
              .map((c) => (
                <Checkbox
                  key={c.slug}
                  checked={filter.collections.includes(c.slug)}
                  onChange={() => onChange({ collections: toggle(filter.collections, c.slug) })}
                  label={c.name}
                  count={colCounts.get(c.slug)}
                />
              ))}
          </div>
        </FacetSection>
      ) : null}
    </div>
  );
}
