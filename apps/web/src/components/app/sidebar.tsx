"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Settings, LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-brand-fg shadow-sm ring-1 ring-inset ring-white/15"
        >
          A
        </span>
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

      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-xs ring-1 ring-inset ring-border/70"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              {/* Active accent bar — the Linear/Vercel cue for "you are here". */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-brand to-brand-2 transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                )}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/15 to-brand-2/10 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/15"
          >
            {initials(email ?? orgName)}
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <ThemeToggle />
        </div>
        <form action={signOut} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ orgName, email }: { orgName: string; email: string | undefined }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
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

  // While open: lock body scroll, focus the drawer, trap Tab inside it, Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [open, close]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/40 lg:flex">
        <SidebarBody orgName={orgName} email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-xs font-bold text-brand-fg shadow-sm ring-1 ring-inset ring-white/15"
          >
            A
          </span>
          <span className="truncate text-sm font-bold tracking-tight">
            AccessAudit<span className="text-brand"> Pro</span>
          </span>
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile off-canvas drawer */}
      <AnimatePresence>
        {open ? (
          <motion.div key="mobile-nav-overlay" className="lg:hidden">
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={close}
              aria-hidden="true"
            />
            <motion.aside
              ref={panelRef}
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col border-r bg-background shadow-lg"
              initial={reduce ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
            >
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close navigation menu"
                className="absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <SidebarBody orgName={orgName} email={email} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
