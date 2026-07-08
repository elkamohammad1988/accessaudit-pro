"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  slug: string;
  name: string;
  variant?: "icon" | "pill";
  className?: string;
}

export function FavoriteButton({ slug, name, variant = "icon", className }: FavoriteButtonProps) {
  const { isFavorite, toggle, ready } = useFavorites();
  const { toast } = useToast();
  const { t } = useI18n();
  const active = ready && isFavorite(slug);

  function handle(e: React.MouseEvent) {
    // Cards are links — don't navigate when the heart is tapped.
    e.preventDefault();
    e.stopPropagation();
    const nowFav = toggle(slug);
    toast({
      title: nowFav ? t("toast.addedFav") : t("toast.removedFav"),
      description: name,
      variant: nowFav ? "favorite" : "info",
    });
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handle}
        aria-pressed={active}
        aria-label={active ? t("common.saved") : t("common.save")}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
          active
            ? "border-brand/40 bg-brand/10 text-brand-deep"
            : "border-border bg-card text-foreground hover:border-brand/40 hover:bg-accent",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", active && "fill-current")} aria-hidden />
        {active ? t("common.saved") : t("common.save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={active}
      aria-label={active ? `${t("common.saved")}: ${name}` : `${t("common.save")}: ${name}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/85 text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 ease-premium hover:scale-105 hover:border-brand/40 hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
        active && "text-brand-deep",
        className,
      )}
    >
      <Heart
        className={cn("h-[1.05rem] w-[1.05rem] transition-transform", active && "scale-110 fill-current text-brand")}
        aria-hidden
      />
    </button>
  );
}
