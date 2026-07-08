"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { searchProducts } from "@/data";
import { categories } from "@/data/categories";
import { ProductGrid } from "@/components/catalog/product-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/components/providers/locale-provider";

export function SearchView() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  useEffect(() => setQuery(params.get("q") ?? ""), [params]);

  const results = useMemo(() => searchProducts(query), [query]);
  const trimmed = query.trim();

  // Reflect the query in the URL (shareable), replacing history so typing doesn't
  // stack entries.
  function onChange(value: string) {
    setQuery(value);
    const next = value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : "/search";
    router.replace(next as never, { scroll: false });
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">{t("nav.search")}</h1>
        <p className="mt-3 text-muted-foreground">Search 48 pieces across eight departments.</p>
        <div className="relative mt-7">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            aria-label={t("nav.search")}
            className="field h-14 w-full rounded-full pl-12 pr-4 text-base"
          />
        </div>
      </div>

      <div className="mt-10">
        {trimmed === "" ? (
          <div className="mx-auto max-w-lg text-center">
            <p className="mb-4 text-sm font-medium text-muted-foreground">Popular departments</p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-brand/40 hover:bg-accent"
                >
                  <c.icon className="h-4 w-4 text-brand-deep" aria-hidden />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("empty.searchTitle")}
            body={`${t("empty.searchBody")} (“${trimmed}”)`}
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground">{results.length}</span>{" "}
              {results.length === 1 ? "result" : "results"} for “{trimmed}”
            </p>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </div>
  );
}
