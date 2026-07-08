"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { getProduct } from "@/data";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/catalog/page-heading";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button";

export function FavoritesView() {
  const { favorites, ready, clear, count } = useFavorites();
  const { toast } = useToast();
  const { t } = useI18n();

  const items = favorites.map((slug) => getProduct(slug)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeading
        crumbs={[{ label: "Home", href: "/" }, { label: t("nav.favorites") }]}
        kicker="Your shortlist"
        title={t("nav.favorites")}
        description="The pieces you've saved to come back to. They live in this browser — no account needed."
        meta={
          ready && count > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                clear();
                toast({ title: t("toast.cleared"), variant: "info" });
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("common.clearAll")}
            </Button>
          ) : null
        }
      />

      <div className="mt-10">
        {!ready ? (
          <ProductGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t("empty.favoritesTitle")}
            body={t("empty.favoritesBody")}
            action={
              <Link href="/catalog" className={buttonClasses("primary", "md")}>
                {t("home.shopCatalog")}
              </Link>
            }
          />
        ) : (
          <ProductGrid products={items} />
        )}
      </div>
    </div>
  );
}
