/**
 * Locale registry — the single source of truth for the i18n system.
 *
 * Adding a new language is a three-step change: (1) add its code to `LOCALES`,
 * (2) add a `LOCALE_META` entry, (3) drop a `messages/<code>/` folder mirroring
 * `messages/en/`. Everything else (switcher, detection, RTL, persistence) derives
 * from this file, so there is no other wiring to touch.
 */

export const LOCALES = ["en", "fr", "ar", "es", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

/** The fallback used when no cookie is set and the browser offers no match. */
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie the locale is persisted under (mirrors the theme system's approach).
 *  Readable by JS so the switcher can flip it client-side without a round-trip. */
export const LOCALE_COOKIE = "locale";

/** One year — locale is a long-lived preference, not a session value. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type Direction = "ltr" | "rtl";

export interface LocaleMeta {
  /** BCP-47 code, also the `messages/<code>` folder name. */
  code: Locale;
  /** Endonym — the language's name in its own script (shown in the switcher). */
  nativeName: string;
  /** Exonym — the English name (shown as a secondary label / aria text). */
  englishName: string;
  /** Writing direction; drives the `dir` attribute on <html>. */
  dir: Direction;
  /** `Intl`/`<html lang>` tag. Kept distinct from `code` so e.g. zh → zh-CN. */
  htmlLang: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", nativeName: "English", englishName: "English", dir: "ltr", htmlLang: "en" },
  fr: { code: "fr", nativeName: "Français", englishName: "French", dir: "ltr", htmlLang: "fr" },
  ar: { code: "ar", nativeName: "العربية", englishName: "Arabic", dir: "rtl", htmlLang: "ar" },
  es: { code: "es", nativeName: "Español", englishName: "Spanish", dir: "ltr", htmlLang: "es" },
  zh: { code: "zh", nativeName: "中文", englishName: "Chinese (Simplified)", dir: "ltr", htmlLang: "zh-CN" },
};

/** Ordered list for rendering the switcher (insertion order of LOCALES). */
export const LOCALE_LIST: readonly LocaleMeta[] = LOCALES.map((code) => LOCALE_META[code]);

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

/** Narrow an arbitrary string to a known locale, falling back to the default. */
export function asLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function directionOf(locale: Locale): Direction {
  return LOCALE_META[locale].dir;
}

export function htmlLangOf(locale: Locale): string {
  return LOCALE_META[locale].htmlLang;
}
