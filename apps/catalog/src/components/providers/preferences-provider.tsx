"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Density = "comfortable" | "compact";

const DENSITY_KEY = "verdant-density";
const MOTION_KEY = "verdant-reduce-motion";

interface PreferencesContextValue {
  density: Density;
  reduceMotion: boolean;
  setDensity: (density: Density) => void;
  setReduceMotion: (reduce: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem(DENSITY_KEY) as Density | null;
    const m = localStorage.getItem(MOTION_KEY);
    if (d) setDensityState(d);
    if (m === "true") {
      setReduceMotionState(true);
      document.documentElement.classList.add("reduce-motion");
    }
  }, []);

  const setDensity = useCallback((next: Density) => {
    localStorage.setItem(DENSITY_KEY, next);
    setDensityState(next);
  }, []);

  const setReduceMotion = useCallback((reduce: boolean) => {
    localStorage.setItem(MOTION_KEY, String(reduce));
    setReduceMotionState(reduce);
    document.documentElement.classList.toggle("reduce-motion", reduce);
  }, []);

  return (
    <PreferencesContext.Provider value={{ density, reduceMotion, setDensity, setReduceMotion }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
