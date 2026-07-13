"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { cn } from "@/lib/utils";

/**
 * Mobile-only marketing nav. Below `sm` the desktop links (Guides / Pricing) and
 * the Language / Theme controls are hidden for space, so this hamburger surfaces
 * them in a dismissible disclosure — otherwise those are unreachable except from
 * the footer. Closes on link click, Escape (returning focus to the trigger), and
 * outside pointer-down.
 */
export function MobileNav({
  guidesLabel,
  pricingLabel,
  signInLabel,
  signInHref,
  openLabel,
  closeLabel,
  navLabel,
  className,
}: {
  guidesLabel: string;
  pricingLabel: string;
  signInLabel: string;
  signInHref: Route;
  openLabel: string;
  closeLabel: string;
  navLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !btnRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const linkClass =
    "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        // Only reference the panel while it exists (it's unmounted when closed) so the
        // IDREF never dangles — matches the TopSearch combobox pattern.
        aria-controls={open ? "marketing-mobile-nav" : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open ? (
        <nav
          ref={panelRef}
          id="marketing-mobile-nav"
          aria-label={navLabel}
          className="glass animate-fade-in absolute end-0 top-11 z-50 w-56 origin-top rounded-xl border p-2 shadow-lg"
        >
          <Link href="/guides" onClick={() => setOpen(false)} className={linkClass}>
            {guidesLabel}
          </Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className={linkClass}>
            {pricingLabel}
          </Link>
          <Link href={signInHref} onClick={() => setOpen(false)} className={linkClass}>
            {signInLabel}
          </Link>
          <div className="my-1 h-px bg-border" role="separator" />
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
