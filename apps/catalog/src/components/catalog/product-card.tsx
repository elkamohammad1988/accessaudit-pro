"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product, ProductBadge } from "@/data/types";
import { getCategory } from "@/data/categories";
import { ProductArt } from "./product-art";
import { FavoriteButton } from "./favorite-button";
import { Rating } from "@/components/ui/rating";
import { Price, savingsPercent } from "@/components/ui/price";
import { useToast } from "@/components/providers/toast-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
  priority?: boolean;
}

function badgeChips(product: Product, saleLabel: string) {
  const chips: { key: ProductBadge; label: string; className: string }[] = [];
  if (product.compareAtPrice) {
    chips.push({
      key: "sale",
      label: `−${savingsPercent(product.price, product.compareAtPrice)}%`,
      className: "bg-danger text-danger-foreground",
    });
  }
  if (product.badges.includes("new"))
    chips.push({ key: "new", label: "New", className: "bg-brand text-brand-fg" });
  else if (product.badges.includes("bestseller"))
    chips.push({ key: "bestseller", label: "Bestseller", className: "bg-foreground text-background" });
  else if (product.badges.includes("limited"))
    chips.push({ key: "limited", label: "Limited", className: "bg-foreground text-background" });
  return chips.slice(0, 2);
}

function Swatches({
  product,
  active,
  onHover,
}: {
  product: Product;
  active: number;
  onHover: (i: number) => void;
}) {
  const shown = product.colorways.slice(0, 4);
  const extra = product.colorways.length - shown.length;
  return (
    <div className="flex items-center gap-1.5">
      {shown.map((c, i) => (
        <button
          key={c.name}
          type="button"
          aria-label={`Preview ${c.name}`}
          onMouseEnter={() => onHover(i)}
          onFocus={() => onHover(i)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHover(i);
          }}
          className={cn(
            "h-4 w-4 rounded-full border border-black/10 ring-offset-1 ring-offset-card transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active === i && "ring-2 ring-brand",
          )}
          style={{ backgroundColor: `hsl(${c.hue} ${c.sat}% ${c.light}%)` }}
        />
      ))}
      {extra > 0 ? (
        <span className="text-[0.6875rem] font-medium text-muted-foreground">+{extra}</span>
      ) : null}
    </div>
  );
}

export function ProductCard({ product, view = "grid" }: ProductCardProps) {
  const [cw, setCw] = useState(0);
  const { toast } = useToast();
  const { t } = useI18n();
  const category = getCategory(product.categorySlug);
  const href = `/products/${product.slug}`;
  const chips = badgeChips(product, t("common.sale"));

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toast({ title: t("toast.addedBag"), description: product.name, variant: "success" });
  }

  if (view === "list") {
    return (
      <Link
        href={href}
        className="group surface flex gap-4 p-3 transition-all duration-300 ease-premium hover:border-brand/30 hover:shadow-md sm:gap-5 sm:p-4"
      >
        <div className="relative w-32 shrink-0 sm:w-44">
          <ProductArt product={product} colorwayIndex={cw} className="aspect-square rounded-lg" />
          {chips.length ? (
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide",
                chips[0].className,
              )}
            >
              {chips[0].label}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-deep">
                {category?.name}
              </p>
              <h3 className="mt-1 truncate text-base font-semibold text-foreground">{product.name}</h3>
            </div>
            <FavoriteButton slug={product.slug} name={product.name} />
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div className="space-y-1.5">
              <Rating value={product.rating} count={product.reviewCount} />
              <Price price={product.price} compareAt={product.compareAtPrice} size="md" />
            </div>
            <Swatches product={product} active={cw} onHover={setCw} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group surface flex flex-col transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-brand/30 hover:shadow-ring"
    >
      <div className="relative">
        <ProductArt product={product} colorwayIndex={cw} className="aspect-[4/5]" />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className={cn(
                "w-fit rounded-full px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide shadow-sm",
                chip.className,
              )}
            >
              {chip.label}
            </span>
          ))}
        </div>

        <div className="absolute right-3 top-3">
          <FavoriteButton slug={product.slug} name={product.name} />
        </div>

        {!product.inStock ? (
          <div className="absolute inset-0 grid place-items-center bg-card/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
              {t("common.outOfStock")}
            </span>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-2 opacity-0 transition-all duration-300 ease-premium group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <button
              type="button"
              onClick={quickAdd}
              className="pointer-events-auto flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-semibold text-background shadow-md transition-colors hover:bg-brand hover:text-brand-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("common.addToBag")}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-deep">
          {category?.name}
        </p>
        <h3 className="mt-1 line-clamp-1 text-[0.9375rem] font-semibold text-foreground">
          {product.name}
        </h3>
        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviewCount} size="sm" showValue={false} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Price price={product.price} compareAt={product.compareAtPrice} size="md" />
          <Swatches product={product} active={cw} onHover={setCw} />
        </div>
      </div>
    </Link>
  );
}
