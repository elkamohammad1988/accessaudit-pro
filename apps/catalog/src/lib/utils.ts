import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class lists and resolve Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a minor-unit price (cents) as a localised currency string. */
export function formatPrice(
  cents: number,
  currency = "USD",
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Deterministic 0..1 float from a string — used to give each product stable art. */
export function hashFloat(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to 0..1
  return ((h >>> 0) % 100000) / 100000;
}

/** Deterministic integer in [0, max) from a string seed. */
export function hashInt(seed: string, max: number): number {
  return Math.floor(hashFloat(seed) * max);
}

/** Clamp a number into an inclusive range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Pluralise with an explicit singular/plural pair. */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Turn a display name into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Format a rating to one decimal (e.g. 4.8). */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

