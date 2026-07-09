"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/app/(auth)/actions";
import { LOCALE_LIST, type Locale } from "@/i18n/config";
import { persistLocale, useLocale, useTranslations } from "@/i18n/provider";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: readonly { value: Theme; icon: typeof Monitor; key: Theme }[] = [
  { value: "system", icon: Monitor, key: "system" },
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
];

/**
 * Account menu — the single home for everything that used to be stacked, cramped,
 * and clipped at the foot of the sidebar (theme cycler, language row, sign-out).
 *
 * The trigger is one compact identity row; clicking it opens a popover *above*
 * (the row lives at the bottom of the rail) that gathers, in one place:
 *   • Settings link
 *   • Appearance — an explicit System / Light / Dark segmented control (replaces
 *     the one mystery icon whose current state you couldn't read)
 *   • Language — every supported language shown at once, active one clearly marked
 *   • Sign out
 *
 * Non-modal popover: Escape and outside-click close it and return focus to the
 * trigger. Used in both the desktop rail and the mobile drawer.
 */
export function AccountMenu({
  orgName,
  email,
  fullName,
  avatarUrl,
  onNavigate,
}: {
  orgName: string;
  email: string | undefined;
  fullName: string | null;
  avatarUrl: string | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("nav");
  const tl = useTranslations("language");
  const tt = useTranslations("common.theme");
  const activeLocale = useLocale();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const displayName = fullName || email || orgName;

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // router.refresh() has no completion callback; clear the pending highlight once
  // the new locale has flowed back in as the active value (server re-rendered).
  useEffect(() => {
    setPendingLocale(null);
  }, [activeLocale]);

  const selectLocale = useCallback(
    (locale: Locale) => {
      if (locale !== activeLocale) {
        setPendingLocale(locale);
        persistLocale(locale);
        router.refresh();
      }
      close();
    },
    [activeLocale, close, router],
  );

  // Outside-click + Escape close the popover; focus the first control on open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("account.menu")}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors",
          open ? "bg-accent/70" : "hover:bg-accent/60",
        )}
      >
        <span className="relative shrink-0">
          <Avatar key={avatarUrl ?? "initials"} src={avatarUrl} name={displayName} />
          {/* Presence indicator — a breathing dot, the universal "active session" cue. */}
          <span
            aria-hidden="true"
            className="live-dot absolute -bottom-0.5 -end-0.5 rounded-full ring-2 ring-muted/40 dark:ring-background"
          />
        </span>
        <span className="min-w-0 flex-1">
          {fullName ? (
            <span className="block truncate text-xs font-medium text-foreground" title={fullName}>
              {fullName}
            </span>
          ) : null}
          <span className="block truncate text-xs text-muted-foreground" title={email}>
            {email}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={menuId}
          role="dialog"
          aria-label={t("account.menu")}
          className="absolute bottom-full end-0 start-0 z-50 mb-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg animate-fade-in"
        >
          <Link
            href="/settings"
            onClick={() => {
              close(false);
              onNavigate?.();
            }}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
          >
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {t("app.settings")}
          </Link>

          <div className="my-1.5 border-t" />

          {/* Appearance — explicit segmented control so the current mode is legible. */}
          <div
            role="radiogroup"
            aria-label={t("account.appearance")}
            className="px-1 pb-1 pt-0.5"
          >
            <p className="px-1.5 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("account.appearance")}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {THEME_OPTIONS.map(({ value, icon: Icon, key }) => {
                const selected = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[0.6875rem] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                      selected
                        ? "border-brand/30 bg-brand/10 text-brand"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tt(`${key}Short`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-1.5 border-t" />

          {/* Language — every option visible at once, active clearly marked. */}
          <div role="radiogroup" aria-label={tl("label")} className="pb-0.5">
            <p className="px-2.5 pb-1 pt-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {tl("label")}
            </p>
            {LOCALE_LIST.map((meta) => {
              const selected =
                pendingLocale != null ? meta.code === pendingLocale : meta.code === activeLocale;
              return (
                <button
                  key={meta.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  lang={meta.htmlLang}
                  onClick={() => selectLocale(meta.code)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-start text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none",
                    selected && "font-medium",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-5 w-7 shrink-0 place-items-center rounded text-[0.625rem] font-semibold uppercase tracking-wide",
                      selected
                        ? "bg-brand/12 text-brand ring-1 ring-inset ring-brand/25"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {meta.code}
                  </span>
                  <span className="flex-1 text-start">
                    <span dir="auto">{meta.nativeName}</span>
                    {meta.englishName !== meta.nativeName ? (
                      <span className="ms-1.5 text-xs text-muted-foreground" dir="ltr">
                        {meta.englishName}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t" />

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:outline-none"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("app.signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
