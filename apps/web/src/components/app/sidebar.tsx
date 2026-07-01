"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslations, useLocale } from "@/i18n/provider";
import { directionOf } from "@/i18n/config";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/clients", key: "clients", icon: Users },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

// Drawer open/close transition length (ms). Matches the `duration-300` on the
// panel so the element unmounts exactly when the slide-out finishes.
const DRAWER_MS = 300;

function initials(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? cleaned[0]).concat(parts[1]?.[0] ?? "").toUpperCase();
}

/** The shared nav body, rendered in both the desktop rail and the mobile drawer. */
function SidebarBody({
  orgName,
  email,
  onNavigate,
}: {
  orgName: string;
  email: string | undefined;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark
          aria-hidden="true"
          className="h-8 w-8 rounded-lg shadow-sm dark:shadow-[0_0_18px_-3px_hsl(var(--brand)/0.6)]"
        />
        <div className="min-w-0">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="block text-sm font-bold leading-tight tracking-tight"
          >
            AccessAudit<span className="text-brand"> Pro</span>
          </Link>
          <p className="truncate text-xs text-muted-foreground" title={orgName}>
            {orgName}
          </p>
        </div>
      </div>

      <nav aria-label={t("primary")} className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                active
                  ? "bg-elevated text-foreground shadow-sm ring-1 ring-inset ring-border/70 dark:bg-white/[0.05] dark:ring-gold/20"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {/* Active accent bar — the Linear/Vercel cue for "you are here".
                  Logical inline-start so it sits on the correct edge in RTL. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute start-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                  // Signature micro-interaction: the Settings gear turns slowly
                  // while you hover the row, then settles. Stilled by reduced-motion.
                  key === "settings" && "group-hover:animate-spin-slow",
                )}
                aria-hidden="true"
              />
              {t(`app.${key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <span className="relative shrink-0">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/15"
            >
              {initials(email ?? orgName)}
            </span>
            {/* Presence indicator — a breathing emerald dot, the universal "active
                session" cue, ringed to read cleanly against the avatar. */}
            <span
              aria-hidden="true"
              className="live-dot absolute -bottom-0.5 -end-0.5 rounded-full ring-2 ring-muted/40 dark:ring-background"
            />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <ThemeToggle />
        </div>
        <div className="mt-1 px-1">
          <LanguageSwitcher className="w-full" align="start" />
        </div>
        <form action={signOut} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("app.signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ orgName, email }: { orgName: string; email: string | undefined }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const dir = directionOf(useLocale());
  // Off-canvas transform for the slide: physical X, so it flips with direction
  // (start-0 sits on the right in RTL, so it exits to the right: +100%).
  const offClass = dir === "rtl" ? "translate-x-full" : "-translate-x-full";
  const [open, setOpen] = useState(false);
  // `render` keeps the drawer mounted through its exit transition; `entered`
  // drives the enter/exit CSS classes. A CSS transition replaces framer-motion's
  // AnimatePresence here — one fewer (large) dependency on every authed route.
  const [render, setRender] = useState(false);
  const [entered, setEntered] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Explicit, user-initiated close (Escape / backdrop / close button): return
  // focus to the trigger so keyboard users aren't dropped at the top of <body>.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close the drawer whenever navigation completes (the page itself changes, so
  // no focus return — that would be disorienting after a route change).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Mount → enter → exit → unmount, driven by `open`. On open we mount, then flip
  // `entered` next frame so the CSS transition runs from off-canvas to on-screen.
  // On close we clear `entered` (slide out) and unmount after the transition ends.
  // `prefers-reduced-motion` is handled in CSS (motion-reduce:transition-none), so
  // the only cost under reduced motion is an invisible, harmless unmount delay.
  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    const id = setTimeout(() => setRender(false), DRAWER_MS);
    return () => clearTimeout(id);
  }, [open]);

  // While mounted: lock body scroll, focus the drawer, trap Tab inside it, Esc closes.
  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [render, close]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col border-e bg-muted/40 lg:flex">
        <SidebarBody orgName={orgName} email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("mobile.open")}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-ms-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <LogoMark
            aria-hidden="true"
            className="h-7 w-7 rounded-lg shadow-sm dark:shadow-[0_0_16px_-3px_hsl(var(--brand)/0.6)]"
          />
          <span className="truncate text-sm font-bold tracking-tight">
            AccessAudit<span className="text-brand"> Pro</span>
          </span>
        </Link>
        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher variant="compact" />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile off-canvas drawer. CSS transitions (no JS animation lib); kept
          mounted through the exit transition via `render`. */}
      {render ? (
        <div className="lg:hidden">
          <div
            className={cn(
              "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none",
              entered ? "opacity-100" : "opacity-0",
            )}
            onClick={close}
            aria-hidden="true"
          />
          <aside
            ref={panelRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={t("mobile.label")}
            className={cn(
              "fixed inset-y-0 start-0 z-50 flex w-72 max-w-[82vw] flex-col border-e bg-background shadow-lg",
              "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
              entered ? "translate-x-0" : offClass,
            )}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label={t("mobile.close")}
              className="absolute end-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarBody orgName={orgName} email={email} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
