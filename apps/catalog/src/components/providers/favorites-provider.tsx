"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const FAVORITES_STORAGE_KEY = "verdant-favorites";

interface FavoritesContextValue {
  favorites: string[];
  count: number;
  ready: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => boolean; // returns the new state (true = now favourited)
  clear: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  // `ready` guards against a hydration flash: buttons render in a neutral state
  // until we've read localStorage on the client.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable (private mode) — state still works in-session */
    }
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  const toggle = useCallback(
    (slug: string) => {
      const has = favorites.includes(slug);
      persist(has ? favorites.filter((s) => s !== slug) : [slug, ...favorites]);
      return !has;
    },
    [favorites, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, count: favorites.length, ready, isFavorite, toggle, clear }),
    [favorites, ready, isFavorite, toggle, clear],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
