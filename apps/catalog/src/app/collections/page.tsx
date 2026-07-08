import type { Metadata } from "next";
import { PageHeading } from "@/components/catalog/page-heading";
import { CollectionCard } from "@/components/catalog/collection-card";
import { Reveal } from "@/components/ui/reveal";
import { collections } from "@/data/collections";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated cross-department edits — six ways to furnish a feeling.",
};

export default function CollectionsPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeading
        crumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]}
        kicker="Curated edits"
        title="Collections"
        description="Rooms, edited. Each collection gathers pieces from across the departments around a single, coherent feeling."
      />
      <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Reveal
            key={c.slug}
            delay={(i % 3) * 70}
            className={i === 0 ? "md:col-span-2 lg:col-span-2" : ""}
          >
            <CollectionCard collection={c} size={i === 0 ? "lg" : "md"} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
