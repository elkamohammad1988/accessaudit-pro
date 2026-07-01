"use client";

/**
 * Client-side i18n. The root layout (a Server Component) reads the active locale
 * and its catalog, then hands both to this provider so Client Components can
 * translate without another round-trip. Mirrors the ergonomics of the server's
 * `getTranslations` — `useTranslations("namespace")` → `t("key")`.
 */
import { createContext, useContext, useMemo } from "react";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_META,
  type Locale,
} from "./config";
import {
  createTranslator,
  scopeMessages,
  type MessageTree,
  type Translator,
} from "./translate";

interface I18nContextValue {
  locale: Locale;
  messages: MessageTree;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: MessageTree;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations must be used within an I18nProvider");
  return ctx;
}

/** The active locale (e.g. for date formatting or conditional layout). */
export function useLocale(): Locale {
  return useI18n().locale;
}

/** A translator scoped to `namespace`, recomputed only when locale/messages change. */
export function useTranslations(namespace?: string): Translator {
  const { locale, messages } = useI18n();
  return useMemo(
    () => createTranslator(scopeMessages(messages, namespace), locale),
    [locale, messages, namespace],
  );
}

/**
 * Persist a new locale and apply it without a full reload of static assets:
 * write the cookie (so SSR picks it up), flip `<html lang/dir>` instantly (no
 * RTL flash), then let the caller refresh the route to re-render Server
 * Components with the new catalog.
 */
export function persistLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
  const el = document.documentElement;
  const meta = LOCALE_META[locale];
  el.lang = meta.htmlLang;
  el.dir = meta.dir;
}
