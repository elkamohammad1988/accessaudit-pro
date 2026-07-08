"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/providers/locale-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

export function LanguageMenu({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale);

  function choose(code: Locale) {
    setLocale(code);
    setOpen(false);
    toast({ title: t("toast.settingsSaved"), variant: "success" });
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("settings.language")}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Globe className="h-[1.1rem] w-[1.1rem]" aria-hidden />
        <span className="hidden uppercase sm:inline">{current?.code}</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-44 animate-scale-in overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={l.code === locale}
              onClick={() => choose(l.code)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                l.code === locale ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                <span>{l.native}</span>
                <span className="text-xs uppercase text-muted-foreground">{l.code}</span>
              </span>
              {l.code === locale ? <Check className="h-4 w-4 text-brand-deep" aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
