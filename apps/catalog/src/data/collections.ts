import type { Collection } from "./types";
import { getProduct } from "./products";

/**
 * Curated cross-category edits. `productSlugs` is the single source of truth for
 * membership — the products module keeps `collectionSlugs` empty and this module
 * back-fills it below, so the two can never drift.
 */
export const collections: Collection[] = [
  {
    slug: "nordic-calm",
    name: "Nordic Calm",
    tagline: "Pale woods, quiet light",
    description:
      "The restraint of a Scandinavian interior — bleached timber, soft wool and light you can almost hear. Everything here earns its place by being useful and by getting out of the way.",
    hue: 200,
    productSlugs: [
      "halden-lounge-chair",
      "column-floor-lamp",
      "linen-duvet-set",
      "monolith-vase",
      "fold-writing-desk",
      "flatweave-wool-rug",
    ],
  },
  {
    slug: "terracotta-season",
    name: "Terracotta Season",
    tagline: "Warm earth, low sun",
    description:
      "A collection the colour of late afternoon — clay, rust and ochre, fired and woven. The warm counterpoint to a minimal room.",
    hue: 16,
    productSlugs: [
      "terracotta-planter-trio",
      "copper-saucepan",
      "boucle-cushion",
      "ember-wall-sconce",
      "ceramic-incense-holder",
      "cedar-sage-candle",
    ],
  },
  {
    slug: "monochrome-edit",
    name: "The Monochrome Edit",
    tagline: "Charcoal, ink and bone",
    description:
      "For the room that speaks in greys. A tightly-edited set of pieces in charcoal, black and bone — architectural, calm and endlessly combinable.",
    hue: 220,
    productSlugs: [
      "nook-two-seat-sofa",
      "orbit-table-lamp",
      "travertine-bookends",
      "leather-desk-mat",
      "cast-iron-dutch-oven",
      "halo-wall-mirror",
    ],
  },
  {
    slug: "artisan-ceramics",
    name: "Artisan Ceramics",
    tagline: "Thrown, glazed, kept",
    description:
      "Pieces shaped by hand and finished in reactive glazes, so no two are identical. Small studios, honest clay, glazes that catch the light.",
    hue: 150,
    productSlugs: [
      "stoneware-dinner-set",
      "ripple-carafe",
      "monolith-vase",
      "ceramic-incense-holder",
      "stoneware-diffuser",
      "glass-ripple-bowl",
    ],
  },
  {
    slug: "garden-room",
    name: "The Garden Room",
    tagline: "Bring the outside in",
    description:
      "Everything for the greenest corner of the house — terracotta, brass and living things. The calmest edit in the catalogue.",
    hue: 142,
    productSlugs: [
      "terracotta-planter-trio",
      "hanging-plant-cradle",
      "self-watering-pot",
      "brass-plant-mister",
      "watering-can",
      "alpaca-bed-blanket",
    ],
  },
  {
    slug: "warm-minimal",
    name: "Warm Minimal",
    tagline: "Spare, but never cold",
    description:
      "Minimalism with the chill taken off — solid oak, hand-woven wool and warm brass. Proof that less can still feel like home.",
    hue: 36,
    productSlugs: [
      "marlow-dining-table",
      "halo-pendant",
      "heirloom-wool-throw",
      "oak-monitor-riser",
      "walnut-cutting-board",
      "perch-counter-stool",
    ],
  },
];

// Validate membership and back-fill each product's collectionSlugs from here, so a
// typo surfaces at build time rather than as a silently-empty collection page.
for (const collection of collections) {
  for (const slug of collection.productSlugs) {
    const product = getProduct(slug);
    if (!product) {
      throw new Error(
        `Collection "${collection.slug}" references unknown product "${slug}".`,
      );
    }
    if (!product.collectionSlugs.includes(collection.slug)) {
      product.collectionSlugs.push(collection.slug);
    }
  }
}

const bySlug = new Map(collections.map((c) => [c.slug, c]));

export function getCollection(slug: string): Collection | undefined {
  return bySlug.get(slug);
}
