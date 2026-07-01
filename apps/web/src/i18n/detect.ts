/**
 * Negotiate the best supported locale from an `Accept-Language` header.
 * Pure and dependency-free so it can run in the Edge middleware. Quality values
 * (`;q=`) are honored; an exact match beats a base-language match (`fr-CA` → `fr`).
 */
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

interface Ranked {
  base: string;
  quality: number;
}

function parseAcceptLanguage(header: string): Ranked[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        base: tag.trim().toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter((r) => r.base.length > 0 && r.quality > 0)
    .sort((a, b) => b.quality - a.quality);
}

export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const { base } of parseAcceptLanguage(acceptLanguage)) {
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
