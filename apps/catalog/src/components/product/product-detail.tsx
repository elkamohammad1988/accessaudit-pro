"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Minus,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { Product } from "@/data/types";
import { getCategory } from "@/data/categories";
import { relatedProducts } from "@/data";
import { Motif } from "@/components/catalog/motif";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SectionHeader } from "@/components/catalog/section-header";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Rating } from "@/components/ui/rating";
import { Price, savingsPercent } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/providers/toast-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { cn, formatPrice } from "@/lib/utils";

const VIEWS = [0, 1, 2, 3];

export function ProductDetail({ product }: { product: Product }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const category = getCategory(product.categorySlug);
  const related = relatedProducts(product, 4);

  const [cw, setCw] = useState(0);
  const [view, setView] = useState(0);
  const [qty, setQty] = useState(1);

  const colorway = product.colorways[cw];
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;

  function addToBag() {
    toast({
      title: t("toast.addedBag"),
      description: `${product.name} · ${colorway.name} · ×${qty}`,
      variant: "success",
    });
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: t("toast.copied"), variant: "info" });
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }

  return (
    <div className="container-page py-8 pb-28 sm:py-10 lg:pb-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: category?.name ?? "Catalogue", href: `/categories/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Motif
            hue={colorway.hue}
            sat={colorway.sat}
            icon={category?.icon}
            seed={`${product.slug}-${view}`}
            className="aspect-square w-full rounded-3xl border border-border shadow-md"
          />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={`View ${v + 1}`}
                aria-current={v === view}
                className={cn(
                  "overflow-hidden rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  v === view ? "border-brand ring-1 ring-brand" : "border-border hover:border-brand/40",
                )}
              >
                <Motif
                  hue={colorway.hue}
                  sat={colorway.sat}
                  icon={category?.icon}
                  seed={`${product.slug}-${v}`}
                  glyphScale={0.44}
                  className="aspect-square w-full"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/categories/${product.categorySlug}`}
              className="text-xs font-semibold uppercase tracking-wide text-brand-deep hover:underline"
            >
              {category?.name}
            </Link>
            {product.badges.includes("bestseller") ? <Badge tone="gold">Bestseller</Badge> : null}
            {product.badges.includes("new") ? <Badge tone="brand">New</Badge> : null}
          </div>

          <h1 className="mt-3 font-display text-3xl text-foreground sm:text-[2.5rem] sm:leading-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-4">
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Price price={product.price} compareAt={product.compareAtPrice} size="lg" />
            {onSale ? (
              <Badge tone="danger">
                Save {savingsPercent(product.price, product.compareAtPrice!)}%
              </Badge>
            ) : null}
          </div>

          <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>

          {/* Colourway */}
          <div className="mt-7">
            <div className="mb-2.5 flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{t("common.colour")}</span>
              <span className="text-muted-foreground">{colorway.name}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colorways.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setCw(i)}
                  aria-label={c.name}
                  aria-pressed={i === cw}
                  title={c.name}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    i === cw ? "border-brand" : "border-transparent hover:border-border",
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-black/10"
                    style={{ backgroundColor: `hsl(${c.hue} ${c.sat}% ${c.light}%)` }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-12 items-center rounded-full border border-border bg-card">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="grid h-12 w-11 place-items-center rounded-full text-foreground transition-colors hover:text-brand-deep disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                disabled={qty >= 10}
                aria-label="Increase quantity"
                className="grid h-12 w-11 place-items-center rounded-full text-foreground transition-colors hover:text-brand-deep disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <button
              onClick={addToBag}
              disabled={!product.inStock}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-brand-fg shadow-sm transition-all hover:bg-brand-deep hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {product.inStock ? t("common.addToBag") : t("common.outOfStock")}
            </button>

            <FavoriteButton slug={product.slug} name={product.name} variant="pill" className="h-12" />

            <button
              onClick={share}
              aria-label={t("common.share")}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Share2 className="h-[1.1rem] w-[1.1rem]" aria-hidden />
            </button>
          </div>

          {/* Stock line */}
          <p className="mt-4 flex items-center gap-2 text-sm">
            <span className={cn("h-2 w-2 rounded-full", product.inStock ? "bg-success" : "bg-danger")} />
            <span className="font-medium text-foreground">
              {product.inStock ? t("common.inStock") : t("common.outOfStock")}
            </span>
            <span className="text-muted-foreground">· {product.origin}</span>
          </p>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card/50 p-4">
            {[
              { icon: Truck, label: "Carbon-neutral delivery" },
              { icon: RefreshCw, label: "30-day returns" },
              { icon: ShieldCheck, label: "Lifetime guarantee" },
            ].map((x) => (
              <div key={x.label} className="flex flex-col items-center gap-1.5 text-center">
                <x.icon className="h-5 w-5 text-brand-deep" strokeWidth={1.6} aria-hidden />
                <span className="text-[0.6875rem] font-medium leading-tight text-muted-foreground">
                  {x.label}
                </span>
              </div>
            ))}
          </div>

          {/* Detail accordion */}
          <div className="mt-8">
            <DetailSection title="Description" defaultOpen>
              <p className="leading-relaxed">{product.description}</p>
            </DetailSection>
            <DetailSection title="Details & dimensions">
              <dl className="grid gap-2.5">
                <Spec label="Materials" value={product.materials.join(", ")} />
                <Spec label="Dimensions" value={product.dimensions} />
                {product.weight ? <Spec label="Weight" value={product.weight} /> : null}
                <Spec label="Origin" value={product.origin} />
              </dl>
            </DetailSection>
            <DetailSection title="Care">
              <p className="leading-relaxed">{product.care}</p>
            </DetailSection>
            <DetailSection title="Shipping & returns">
              <p className="leading-relaxed">
                Ships carbon-neutral in 3–5 working days, packed plastic-free. Enjoy 30 days to
                decide — returns are free, and every piece is covered by our lifetime guarantee.
              </p>
            </DetailSection>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-20">
          <SectionHeader title={t("common.relatedProducts")} />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}

      {/* Sticky mobile action bar */}
      <div className="glass fixed inset-x-0 bottom-16 z-30 border-t px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{product.name}</p>
            <Price price={product.price} compareAt={product.compareAtPrice} size="md" />
          </div>
          <FavoriteButton slug={product.slug} name={product.name} />
          <button
            onClick={addToBag}
            disabled={!product.inStock}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("common.addToBag")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-border py-4 first:border-t" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pt-3 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
