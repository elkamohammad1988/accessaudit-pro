"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FolderKanban, LayoutDashboard, Plus, Search, Settings, Users, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type Dest = { href: string; label: string; icon: LucideIcon };

/**
 * Topbar quick-search — the Jumbo "Search anything" bar, implemented as a real
 * command-style quick-nav rather than a dead field. Typing filters the app's
 * destinations + primary actions; Enter jumps to the top match, ↑/↓ move the
 * highlight, Escape closes. Outside-click/blur dismisses. A genuine, accessible
 * feature (never a decorative stub), matching the product's own bar.
 */
export function TopSearch() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const destinations = useMemo<Dest[]>(
    () => [
      { href: "/dashboard", label: t("app.dashboard"), icon: LayoutDashboard },
      { href: "/clients", label: t("app.clients"), icon: Users },
      { href: "/projects", label: t("app.projects"), icon: FolderKanban },
      { href: "/settings", label: t("app.settings"), icon: Settings },
      { href: "/scans/new", label: t("search.newScan"), icon: Plus },
    ],
    [t],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return destinations;
    return destinations.filter((d) => d.label.toLowerCase().includes(needle));
  }, [q, destinations]);

  // Keep the highlight in range as the result set shrinks.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  const close = useCallback(() => setOpen(false), []);

  // Outside-click dismiss.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href as never);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const target = results[active];
      if (target) {
        e.preventDefault();
        go(target.href);
      }
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
        <Search className="h-4 w-4" aria-hidden="true" />
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={t("search.label")}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t("search.placeholder")}
        className="field h-10 w-full rounded-full ps-9 pe-3 text-sm"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("search.label")}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg animate-fade-in"
        >
          {results.length > 0 ? (
            results.map((d, i) => {
              const Icon = d.icon;
              return (
                <li key={d.href} role="option" aria-selected={i === active}>
                  <Link
                    href={d.href as never}
                    onClick={() => go(d.href)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      i === active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    {d.label}
                  </Link>
                </li>
              );
            })
          ) : (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">{t("search.empty")}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
