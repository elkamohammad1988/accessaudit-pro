"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/provider";
import { useTheme, type Theme } from "./theme-provider";

const ORDER: readonly Theme[] = ["system", "light", "dark"];
const ICONS: Record<Theme, typeof Monitor> = { system: Monitor, light: Sun, dark: Moon };

/** Accessible single-button theme cycler: system → light → dark → system. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common.theme");
  const Icon = ICONS[theme];
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={t(theme)}
      aria-label={t("toggleAria", { current: t(theme), next: t(next) })}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
