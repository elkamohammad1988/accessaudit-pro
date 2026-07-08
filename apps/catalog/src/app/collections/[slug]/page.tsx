import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DetailBanner } from "@/components/catalog/detail-banner";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { collections, getCollection } from "@/data/collections";
import { productsByCollection } from "@/data";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection" };
  return { title: collection.name, description: collection.description };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const base = productsByCollection(slug);

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection.name },
        ]}
      />
      <DetailBanner
        hue={collection.hue}
        icon={Sparkles}
        seed={collection.slug}
        kicker={collection.tagline}
        title={collection.name}
        description={collection.description}
      />
      <div className="mt-10">
        <CatalogBrowser base={base} hideCollectionFacet />
      </div>
    </div>
  );
}
