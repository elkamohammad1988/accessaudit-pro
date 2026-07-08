"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { searchProducts } from "@/data";
import { categories } from "@/data/categories";
import { ProductArt } from "@/components/catalog/product-art";
import { Price } from "@/components/ui/price";
import { getCategory } from "@/data/categories";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

interface SearchContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}
const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen ? <SearchDialog onClose={close} /> : null}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchProducts(query).slice(0, 6), [query]);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => setActive(0), [query]);

  const go = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/products/${slug}`);
    },
    [onClose, router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active].slug);
      else if (query.trim()) {
        onClose();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]">
      <button
        aria-label="Close search"
        className="absolute inset-0 animate-fade-in bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the catalogue"
        onKeyDown={onKeyDown}
        className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="h-14 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Search"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="p-2">
              <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("nav.categories")}
              </p>
              <div className="flex flex-wrap gap-2 px-1">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categories/${c.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-brand/40 hover:bg-accent"
                  >
                    <c.icon className="h-3.5 w-3.5 text-brand-deep" aria-hidden />
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">{t("empty.searchTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("empty.searchBody")}</p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Search results">
              {results.map((p, i) => {
                const category = getCategory(p.categorySlug);
                return (
                  <li key={p.slug} role="option" aria-selected={i === active}>
                    <button
                      onClick={() => go(p.slug)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors",
                        i === active ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <ProductArt
                        product={p}
                        className="h-12 w-12 shrink-0 rounded-lg"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {p.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">{category?.name}</span>
                      </span>
                      <Price price={p.price} compareAt={p.compareAtPrice} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="hidden items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-muted-foreground sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5">
              <ArrowUp className="h-3 w-3" aria-hidden />
              <ArrowDown className="h-3 w-3" aria-hidden />
            </kbd>
            to navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5">
              <CornerDownLeft className="h-3 w-3" aria-hidden />
            </kbd>
            to select
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans">Esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
