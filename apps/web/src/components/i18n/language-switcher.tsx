"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";
import { LOCALE_LIST, type Locale } from "@/i18n/config";
import { persistLocale, useLocale, useTranslations } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Accessible language picker. Shows the active language (flag + native name) and,
 * on open, a radio-style menu of every supported language. Selecting one writes
 * the locale cookie, flips `<html lang/dir>` instantly (no RTL flash), and
 * refreshes the route so Server Components re-render in the new language.
 *
 * `variant="compact"` collapses the trigger to the flag + chevron for tight
 * chrome (mobile bars); `full` shows the native name too.
 */
export function LanguageSwitcher({
  className,
  variant = "full",
  align = "end",
}: {
  className?: string;
  variant?: "full" | "compact";
  align?: "start" | "end";
}) {
  const router = useRouter();
  const active = useLocale();
  const t = useTranslations("language");
  const activeMeta = LOCALE_LIST.find((l) => l.code === active) ?? LOCALE_LIST[0];

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [isPending, setPending] = useState(false);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // router.refresh() gives no completion signal, so clear the pending flag once the
  // new locale has flowed back in as `active` (server re-rendered). Without this the
  // trigger (disabled while pending) would stay disabled after a language change.
  useEffect(() => {
    setPending(false);
  }, [active]);

  const select = useCallback(
    (locale: Locale) => {
      if (locale !== active) {
        setPending(true);
        persistLocale(locale);
        router.refresh();
      }
      close();
    },
    [active, close, router],
  );

  // Close on outside click and on Escape; basic roving focus with arrow keys.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      const items = rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      if (!items || items.length === 0) return;
      const list = Array.from(items);
      const idx = list.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        list[(idx + 1 + list.length) % list.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        list[(idx - 1 + list.length) % list.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        list[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        list[list.length - 1]?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    // Focus the checked item when the menu opens.
    const checked = rootRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
    checked?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("change")}
        title={t("change")}
        disabled={isPending}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-60",
          variant === "compact" ? "w-auto" : "",
        )}
      >
        {variant === "compact" ? (
          <Languages className="h-4 w-4" aria-hidden="true" />
        ) : (
          <>
            <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{activeMeta.nativeName}</span>
          </>
        )}
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("label")}
          className={cn(
            "absolute z-50 mt-1.5 min-w-[12rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-fade-in",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {LOCALE_LIST.map((meta) => {
            const checked = meta.code === active;
            return (
              <button
                key={meta.code}
                role="menuitemradio"
                aria-checked={checked}
                type="button"
                lang={meta.htmlLang}
                dir={meta.dir}
                onClick={() => select(meta.code)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none",
                  checked && "font-medium",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-5 w-7 shrink-0 place-items-center rounded text-[0.625rem] font-semibold uppercase tracking-wide",
                    checked
                      ? "bg-brand/12 text-brand ring-1 ring-inset ring-brand/25"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {meta.code}
                </span>
                <span className="flex-1 text-start">
                  {meta.nativeName}
                  {meta.englishName !== meta.nativeName ? (
                    <span className="ms-1.5 text-xs text-muted-foreground" dir="ltr">
                      {meta.englishName}
                    </span>
                  ) : null}
                </span>
                {checked ? (
                  <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
