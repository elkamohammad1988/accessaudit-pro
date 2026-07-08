"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LOCALE_STORAGE_KEY } from "@/lib/theme-script";
import { dirOf, translate, type Locale } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
      document.documentElement.dir = dirOf(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
    document.documentElement.lang = next;
    document.documentElement.dir = dirOf(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, dir: dirOf(locale), setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within a LocaleProvider");
  return ctx;
}
