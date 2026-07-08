import Link from "next/link";
import { ArrowRight, Leaf, RefreshCw, Sprout, Truck } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { SectionHeader } from "@/components/catalog/section-header";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ProductArt } from "@/components/catalog/product-art";
import { CategoryCard } from "@/components/catalog/category-card";
import { CollectionCard } from "@/components/catalog/collection-card";
import { Rating } from "@/components/ui/rating";
import { Price } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { featuredProducts, newArrivals } from "@/data";

const MARQUEE = [
  "Carbon-neutral delivery",
  "30-day returns",
  "Made to be repaired",
  "Ethically sourced",
  "Free material swatches",
  "Lifetime guarantee",
];

const PROMISES = [
  { icon: Truck, title: "Carbon-neutral delivery", body: "Every order ships plastic-free and climate-offset, worldwide." },
  { icon: RefreshCw, title: "30-day returns", body: "Live with it for a month. If it isn't right, send it back — on us." },
  { icon: Sprout, title: "Made to be repaired", body: "Solid materials and honest joinery, chosen to be mended not binned." },
  { icon: Leaf, title: "Ethically sourced", body: "Small workshops, named makers, and materials we can trace." },
];

export default function Home() {
  const featured = featuredProducts();
  const hero = featured[0];
  const heroSecondary = featured[1];
  const arrivals = newArrivals(8);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-8 lg:py-24">
          <div className="animate-rise-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              The Spring Catalogue · 2026
            </span>
            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.02] text-foreground sm:text-6xl">
              Considered things, for a{" "}
              <span className="text-brand-gradient italic">considered</span> home.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              A small, opinionated catalogue of furniture, lighting and living objects — collected
              for how they age, not just how they look.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/catalog" className={buttonClasses("primary", "lg")}>
                Shop the catalogue
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
              <Link href="/categories" className={buttonClasses("secondary", "lg")}>
                Browse departments
              </Link>
            </div>
            <dl className="mt-10 flex gap-8">
              {[
                { n: "48", l: "Curated pieces" },
                { n: "8", l: "Departments" },
                { n: "4.8", l: "Avg. rating" },
              ].map((stat) => (
                <div key={stat.l}>
                  <dt className="font-display text-3xl font-semibold text-foreground">{stat.n}</dt>
                  <dd className="mt-0.5 text-xs text-muted-foreground">{stat.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual collage */}
          <div className="relative mx-auto w-full max-w-md lg:mr-0 lg:max-w-none">
            {hero ? (
              <div className="relative">
                <Link href={`/products/${hero.slug}`} className="block">
                  <ProductArt
                    product={hero}
                    className="aspect-[4/5] rounded-3xl border border-border shadow-xl"
                  />
                </Link>
                {/* Floating info card */}
                <div className="absolute -bottom-6 left-4 w-56 rounded-2xl border border-border bg-popover/95 p-4 shadow-lg backdrop-blur-sm sm:left-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-deep">
                    Featured
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{hero.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Price price={hero.price} size="md" />
                    <Rating value={hero.rating} showValue={false} />
                  </div>
                </div>
                {/* Secondary tile */}
                {heroSecondary ? (
                  <Link
                    href={`/products/${heroSecondary.slug}`}
                    className="absolute -right-4 -top-6 hidden w-32 sm:block lg:-right-6"
                  >
                    <ProductArt
                      product={heroSecondary}
                      className="aspect-square rounded-2xl border border-border shadow-lg"
                    />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Marquee */}
        <div className="border-y border-border bg-card/40 py-4">
          <div className="edge-fade-x overflow-hidden">
            <div className="flex w-max animate-marquee items-center gap-3 whitespace-nowrap">
              {[...MARQUEE, ...MARQUEE].map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                  {item}
                  <span className="h-1 w-1 rounded-full bg-brand/50" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeader
            kicker="Editor's picks"
            title="Featured this season"
            subtitle="A handful of pieces we can't stop recommending."
            href="/catalog"
            linkLabel="View all"
          />
        </Reveal>
        <Reveal delay={80} className="mt-10">
          <ProductGrid products={featured} />
        </Reveal>
      </section>

      {/* ── Departments ──────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card/30 py-16 sm:py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeader
              kicker="Browse"
              title="Shop by department"
              subtitle="Eight departments, one restrained point of view."
              href="/categories"
              linkLabel="All departments"
            />
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 4) * 60}>
                <CategoryCard category={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collections ──────────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeader
            kicker="Curated edits"
            title="Shop by collection"
            subtitle="Rooms, edited. Six ways to furnish a feeling."
            href="/collections"
            linkLabel="All collections"
          />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 3) * 70} className={i === 0 ? "md:col-span-2 lg:col-span-2" : ""}>
              <CollectionCard collection={c} size={i === 0 ? "lg" : "md"} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── New arrivals ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30 py-16 sm:py-20">
        <div className="container-page">
          <Reveal>
            <SectionHeader
              kicker="Fresh in"
              title="Just arrived"
              subtitle="The latest additions to the catalogue."
              href="/catalog"
              linkLabel="View all"
            />
          </Reveal>
          <Reveal delay={80} className="mt-10">
            <ProductGrid products={arrivals} />
          </Reveal>
        </div>
      </section>

      {/* ── Promise band ─────────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <Reveal>
          <SectionHeader
            align="center"
            kicker="Why Verdant"
            title="A catalogue you can trust"
            subtitle="Every piece is chosen against the same short list of principles."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={(i % 4) * 60}>
              <div className="surface h-full p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand-deep">
                  <p.icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────────── */}
      <section className="container-page pb-8">
        <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-brand/[0.07] px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,hsl(var(--brand)/0.14),transparent_70%)]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl text-foreground sm:text-4xl">
              Furnish a feeling, one considered thing at a time.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Start with the full catalogue, or let a collection do the editing for you.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/catalog" className={buttonClasses("primary", "lg")}>
                Explore the catalogue
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
              <Link href="/collections" className={buttonClasses("outline", "lg")}>
                See the collections
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
