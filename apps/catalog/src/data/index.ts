import { products } from "./products";
import { categories, getCategory } from "./categories";
// Importing collections runs its side-effect: back-filling every product's
// collectionSlugs. Keep this import so membership is populated before any query.
import { collections, getCollection } from "./collections";
import type { Product, ProductBadge } from "./types";

export { products, categories, collections, getCategory, getCollection };
export { getProduct } from "./products";
export type { Product, Category, Collection, Colorway, ProductBadge } from "./types";

export type SortKey =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Alphabetical" },
];

export interface FilterState {
  categories: string[];
  collections: string[];
  colorways: string[];
  badges: ProductBadge[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  inStockOnly: boolean;
  query: string;
}

export const emptyFilter: FilterState = {
  categories: [],
  collections: [],
  colorways: [],
  badges: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStockOnly: false,
  query: "",
};

/** Min/max price across the catalogue (cents) — anchors the price-range control. */
export function priceBounds(): { min: number; max: number } {
  const prices = products.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Every distinct colourway (unique by name), sorted — powers the colour facet. */
export function allColorways(pool: Product[] = products): import("./types").Colorway[] {
  const byName = new Map<string, import("./types").Colorway>();
  for (const p of pool) {
    for (const c of p.colorways) {
      if (!byName.has(c.name)) byName.set(c.name, c);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function featuredProducts(limit?: number): Product[] {
  const list = products.filter((p) => p.featured);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function newArrivals(limit = 8): Product[] {
  return [...products].sort((a, b) => b.arrival - a.arrival).slice(0, limit);
}

export function bestSellers(limit = 8): Product[] {
  return products
    .filter((p) => p.badges.includes("bestseller"))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function onSale(limit?: number): Product[] {
  const list = products.filter((p) => p.compareAtPrice);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function productsByCategory(slug: string): Product[] {
  return products.filter((p) => p.categorySlug === slug);
}

export function productsByCollection(slug: string): Product[] {
  return products.filter((p) => p.collectionSlugs.includes(slug));
}

/** Products related to `product`: shared collection first, then same category. */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const scored = products
    .filter((p) => p.slug !== product.slug)
    .map((p) => {
      let score = 0;
      if (p.categorySlug === product.categorySlug) score += 2;
      score += p.collectionSlugs.filter((c) => product.collectionSlugs.includes(c)).length * 3;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);
  return scored.slice(0, limit).map((x) => x.p);
}

/** Free-text search across name, department, collection, materials and blurb. */
export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return products
    .map((p) => {
      const category = getCategory(p.categorySlug);
      const haystack = [
        p.name,
        category?.name ?? "",
        p.materials.join(" "),
        p.shortDescription,
        p.colorways.map((c) => c.name).join(" "),
        ...p.collectionSlugs.map((s) => getCollection(s)?.name ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      // A product matches only if every term is present somewhere.
      const matched = terms.every((t) => haystack.includes(t));
      if (!matched) return null;
      // Rank an exact name-start hit highest.
      const nameHit = p.name.toLowerCase().startsWith(q) ? 3 : p.name.toLowerCase().includes(q) ? 2 : 1;
      return { p, score: nameHit + p.rating / 10 };
    })
    .filter((x): x is { p: Product; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const out = [...list];
  switch (sort) {
    case "newest":
      return out.sort((a, b) => b.arrival - a.arrival);
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "rating":
      return out.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "name":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return out.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
      );
  }
}

/** Apply a filter set to a base list, then sort. Pure — safe to run client-side. */
export function filterAndSort(
  base: Product[],
  filter: FilterState,
  sort: SortKey,
): Product[] {
  const q = filter.query.trim().toLowerCase();
  const filtered = base.filter((p) => {
    if (filter.categories.length && !filter.categories.includes(p.categorySlug)) return false;
    if (filter.collections.length && !filter.collections.some((c) => p.collectionSlugs.includes(c)))
      return false;
    if (filter.colorways.length && !p.colorways.some((c) => filter.colorways.includes(c.name)))
      return false;
    if (filter.badges.length && !filter.badges.some((b) => p.badges.includes(b))) return false;
    if (filter.minPrice != null && p.price < filter.minPrice) return false;
    if (filter.maxPrice != null && p.price > filter.maxPrice) return false;
    if (filter.minRating != null && p.rating < filter.minRating) return false;
    if (filter.inStockOnly && !p.inStock) return false;
    if (q) {
      const hay = `${p.name} ${p.materials.join(" ")} ${p.shortDescription}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return sortProducts(filtered, sort);
}

/** True when any facet is active (drives the "clear all" affordance + empty copy). */
export function isFilterActive(filter: FilterState): boolean {
  return (
    filter.categories.length > 0 ||
    filter.collections.length > 0 ||
    filter.colorways.length > 0 ||
    filter.badges.length > 0 ||
    filter.minPrice != null ||
    filter.maxPrice != null ||
    filter.minRating != null ||
    filter.inStockOnly ||
    filter.query.trim().length > 0
  );
}
