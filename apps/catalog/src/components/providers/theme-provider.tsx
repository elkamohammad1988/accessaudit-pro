"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolved: Resolved;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme): Resolved {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.colorScheme = dark ? "dark" : "light";
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // First render must match the server (the no-flash script already set the class).
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    setResolved(applyTheme(stored));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) === "system") {
        setResolved(applyTheme("system"));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
    setResolved(applyTheme(next));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
