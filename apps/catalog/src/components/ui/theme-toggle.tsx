"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

/** A single icon button that flips between light and dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {mounted ? (
        isDark ? (
          <Moon className="h-[1.15rem] w-[1.15rem]" aria-hidden />
        ) : (
          <Sun className="h-[1.15rem] w-[1.15rem]" aria-hidden />
        )
      ) : (
        <span className="h-[1.15rem] w-[1.15rem]" />
      )}
    </button>
  );
}
