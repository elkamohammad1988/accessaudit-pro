import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/data/types";
import { productsByCategory } from "@/data";
import { Motif } from "./motif";

export function CategoryCard({ category }: { category: Category }) {
  const count = productsByCategory(category.slug).length;
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border shadow-sm transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Motif
        hue={category.hue}
        icon={category.icon}
        seed={category.slug}
        glyphScale={0.5}
        className="aspect-[5/4] transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-white sm:text-xl">
            {category.name}
          </h3>
          <p className="mt-0.5 text-xs text-white/75">
            {count} {count === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-foreground">
          <ArrowUpRight className="h-[1.1rem] w-[1.1rem]" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
