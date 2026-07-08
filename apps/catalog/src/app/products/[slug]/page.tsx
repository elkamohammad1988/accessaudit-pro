import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/data";
import { getCategory } from "@/data/categories";
import { ProductDetail } from "@/components/product/product-detail";
import { formatPrice } from "@/lib/utils";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product" };
  const category = getCategory(product.categorySlug);
  return {
    title: product.name,
    description: `${product.shortDescription} ${formatPrice(product.price)} · ${category?.name}.`,
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
