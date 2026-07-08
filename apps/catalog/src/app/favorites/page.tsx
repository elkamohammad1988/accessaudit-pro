import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/favorites-view";

export const metadata: Metadata = {
  title: "Favourites",
  description: "The pieces you've saved from the Verdant catalogue.",
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
