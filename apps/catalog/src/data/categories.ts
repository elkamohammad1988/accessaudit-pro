import {
  Armchair,
  Lamp,
  CookingPot,
  Layers,
  Shapes,
  Leaf,
  PenTool,
  Flower2,
} from "lucide-react";
import type { Category } from "./types";

/**
 * Eight departments. `hue` seeds the generated artwork so every product in a
 * department shares a family of colour without any two tiles looking identical.
 */
export const categories: Category[] = [
  {
    slug: "furniture",
    name: "Furniture",
    tagline: "Pieces you live with",
    description:
      "Chairs, tables and seating built from solid timber and honest joinery — made to be repaired, not replaced.",
    icon: Armchair,
    hue: 28,
  },
  {
    slug: "lighting",
    name: "Lighting",
    tagline: "Warmth, on a dimmer",
    description:
      "Sculptural lamps and pendants that treat light as a material — soft, directional and quietly beautiful.",
    icon: Lamp,
    hue: 42,
  },
  {
    slug: "kitchen",
    name: "Kitchen & Dining",
    tagline: "Tools for the table",
    description:
      "Cookware, ceramics and glassware with the heft and balance of things designed to be used every day.",
    icon: CookingPot,
    hue: 8,
  },
  {
    slug: "textiles",
    name: "Textiles",
    tagline: "Cloth with a hand",
    description:
      "Throws, cushions and rugs woven from natural fibres — linen, wool and cotton with real texture.",
    icon: Layers,
    hue: 200,
  },
  {
    slug: "decor",
    name: "Decor & Objects",
    tagline: "Considered small things",
    description:
      "Vases, mirrors and objects that hold a room together — the last five percent that makes a space feel finished.",
    icon: Shapes,
    hue: 280,
  },
  {
    slug: "plants",
    name: "Plants & Garden",
    tagline: "Living, growing things",
    description:
      "Planters, tools and hardy greenery for the windowsill and the garden room — the calmest corner of the catalogue.",
    icon: Leaf,
    hue: 142,
  },
  {
    slug: "workspace",
    name: "Workspace",
    tagline: "Desks worth sitting at",
    description:
      "Stationery, organisers and desk objects that make the hours at the desk feel deliberate and clear.",
    icon: PenTool,
    hue: 220,
  },
  {
    slug: "wellness",
    name: "Wellness",
    tagline: "Rituals, slowed down",
    description:
      "Bath, scent and quiet-hour objects — small luxuries that turn a routine into something worth keeping.",
    icon: Flower2,
    hue: 330,
  },
];

const bySlug = new Map(categories.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category | undefined {
  return bySlug.get(slug);
}
