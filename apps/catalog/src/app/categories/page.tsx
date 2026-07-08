import type { Metadata } from "next";
import { PageHeading } from "@/components/catalog/page-heading";
import { CategoryCard } from "@/components/catalog/category-card";
import { Reveal } from "@/components/ui/reveal";
import { categories } from "@/data/categories";

export const metadata: Metadata = {
  title: "Departments",
  description: "The eight departments of the Verdant catalogue.",
};

export default function CategoriesPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeading
        crumbs={[{ label: "Home", href: "/" }, { label: "Departments" }]}
        kicker="Browse by room"
        title="Departments"
        description="Eight departments, one restrained point of view. Every piece earns its place by being useful and by getting out of the way."
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 4) * 60}>
            <CategoryCard category={c} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
