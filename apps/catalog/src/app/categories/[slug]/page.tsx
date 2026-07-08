import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DetailBanner } from "@/components/catalog/detail-banner";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { categories, getCategory } from "@/data/categories";
import { productsByCategory } from "@/data";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Department" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const base = productsByCategory(slug);

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Departments", href: "/categories" },
          { label: category.name },
        ]}
      />
      <DetailBanner
        hue={category.hue}
        icon={category.icon}
        seed={category.slug}
        kicker={category.tagline}
        title={category.name}
        description={category.description}
      />
      <div className="mt-10">
        <CatalogBrowser base={base} hideCategoryFacet />
      </div>
    </div>
  );
}
