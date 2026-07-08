import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/search-view";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Verdant catalogue.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page py-20" />}>
      <SearchView />
    </Suspense>
  );
}
