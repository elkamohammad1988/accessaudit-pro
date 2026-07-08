import type { Metadata } from "next";
import { PageHeading } from "@/components/catalog/page-heading";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { products } from "@/data";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Browse the full Verdant catalogue — filter by department, price, colour and more.",
};

export default function CatalogPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeading
        crumbs={[{ label: "Home", href: "/" }, { label: "Catalogue" }]}
        kicker="Everything, in one place"
        title="The full catalogue"
        description="Forty-eight considered pieces across eight departments. Filter, sort and find the thing you didn't know you were looking for."
      />
      <div className="mt-10">
        <CatalogBrowser base={products} />
      </div>
    </div>
  );
}
