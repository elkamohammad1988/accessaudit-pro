import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Sparkles } from "lucide-react";
import type { Collection } from "@/data/types";
import { productsByCollection } from "@/data";
import { Motif } from "./motif";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  collection: Collection;
  size?: "md" | "lg";
}

export function CollectionCard({ collection, size = "md" }: CollectionCardProps) {
  const count = productsByCollection(collection.slug).length;
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border shadow-sm transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Motif
        hue={collection.hue}
        icon={Sparkles}
        seed={collection.slug}
        glyphScale={0.34}
        className={cn(
          "absolute inset-0 h-full w-full transition-transform duration-500 ease-premium group-hover:scale-[1.04]",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className={cn("relative p-5", size === "lg" ? "sm:p-8" : "sm:p-6")}>
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/70">
          {count} {count === 1 ? "piece" : "pieces"}
        </p>
        <h3
          className={cn(
            "font-display font-semibold text-white",
            size === "lg" ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl",
          )}
        >
          {collection.name}
        </h3>
        <p
          className={cn(
            "mt-1.5 max-w-md text-white/80",
            size === "lg" ? "text-sm sm:text-base" : "text-sm",
          )}
        >
          {collection.tagline}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
          Explore collection
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
        </span>
      </div>
      {/* Aspect spacer to give the card height when absolutely-positioned art is used */}
      <div className={cn("invisible", size === "lg" ? "pt-[62%]" : "pt-[78%]")} aria-hidden />
    </Link>
  );
}
