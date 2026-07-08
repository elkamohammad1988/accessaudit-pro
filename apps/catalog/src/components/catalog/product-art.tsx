import { getCategory } from "@/data/categories";
import type { Product } from "@/data/types";
import { Motif } from "./motif";

interface ProductArtProps {
  product: Product;
  /** Which colourway to tint the art with. */
  colorwayIndex?: number;
  /** Varies blob placement + glyph angle so a gallery shows distinct "shots". */
  variant?: number;
  className?: string;
}

/**
 * A generated, deterministic product visual — our stand-in for photography.
 * Tinted by the selected colourway and stamped with the department glyph, via the
 * shared Motif language so it belongs to the same family as category tiles.
 */
export function ProductArt({ product, colorwayIndex = 0, variant = 0, className }: ProductArtProps) {
  const cw = product.colorways[colorwayIndex] ?? product.colorways[0];
  const category = getCategory(product.categorySlug);
  return (
    <Motif
      hue={cw.hue}
      sat={cw.sat}
      icon={category?.icon}
      seed={`${product.slug}-${variant}`}
      className={className}
    />
  );
}
