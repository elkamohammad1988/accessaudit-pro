import type { LucideIcon } from "lucide-react";

/** A named colour option for a product — also seeds its generated artwork. */
export interface Colorway {
  name: string;
  /** HSL channels for the swatch + art tint. */
  hue: number;
  sat: number;
  light: number;
}

export type ProductBadge = "new" | "bestseller" | "limited" | "sale";

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Base hue for the category's generated artwork. */
  hue: number;
}

export interface Collection {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  hue: number;
  /** Slugs of the products curated into this collection. */
  productSlugs: string[];
}

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  collectionSlugs: string[];
  /** Price in minor units (cents). */
  price: number;
  /** Optional strike-through original price (cents) — drives the "sale" badge. */
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  badges: ProductBadge[];
  inStock: boolean;
  featured: boolean;
  colorways: Colorway[];
  materials: string[];
  dimensions: string;
  weight?: string;
  origin: string;
  shortDescription: string;
  description: string;
  care: string;
  /** Higher = more recently added (drives "Newest" sort + "New arrivals"). */
  arrival: number;
}
