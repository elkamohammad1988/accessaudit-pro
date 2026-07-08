"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, User, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageMenu } from "./language-menu";
import { useSearch } from "./search-overlay";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/catalog", key: "nav.catalog" },
  { href: "/categories", key: "nav.categories" },
  { href: "/collections", key: "nav.collections" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { open } = useSearch();
  const { count, ready } = useFavorites();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="glass sticky top-0 z-50 border-b">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogoMark />
          </Link>
        </div>

        {/* Center: primary nav (desktop) */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-brand-deep"
                  : "text-foreground/80 hover:bg-accent hover:text-foreground",
              )}
            >
              {t(link.key)}
              {isActive(link.href) ? (
                <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-brand" />
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* Desktop search pill */}
          <button
            type="button"
            onClick={open}
            className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card/60 pl-3.5 pr-2.5 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:bg-accent lg:inline-flex"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span>{t("nav.search")}</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.625rem] font-medium">
              ⌘K
            </kbd>
          </button>
          {/* Mobile search icon */}
          <button
            type="button"
            onClick={open}
            aria-label={t("nav.search")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Search className="h-[1.15rem] w-[1.15rem]" aria-hidden />
          </button>

          <Link
            href="/favorites"
            aria-label={`${t("nav.favorites")}${ready && count ? ` (${count})` : ""}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Heart className="h-[1.15rem] w-[1.15rem]" aria-hidden />
            {ready && count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold text-brand-fg">
                {count}
              </span>
            ) : null}
          </Link>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden sm:block">
            <LanguageMenu />
          </div>

          <Link
            href="/profile"
            aria-label={t("nav.profile")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <User className="h-[1.15rem] w-[1.15rem]" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen ? (
        <div className="animate-fade-in border-t border-border bg-popover lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
            {[{ href: "/", key: "nav.home" }, ...LINKS, { href: "/favorites", key: "nav.favorites" }].map(
              (link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-brand/10 text-brand-deep"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  {t(link.key)}
                </Link>
              ),
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
              <ThemeToggle />
              <LanguageMenu />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
