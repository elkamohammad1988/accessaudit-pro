import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getTranslations } from "@/i18n/server";

const PUBLISHED = "2026-06-25";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guides.eaa");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: "/guides/european-accessibility-act" },
    openGraph: {
      type: "article",
      title,
      description,
      url: "/guides/european-accessibility-act",
    },
  };
}

// Reuse the legal pages' prose styling for long-form copy.
const PROSE =
  "mt-6 space-y-4 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[hsl(var(--foreground))] [&_h3]:mt-5 [&_h3]:font-medium [&_h3]:text-[hsl(var(--foreground))] [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:ps-6 [&_p]:text-muted-foreground [&_li]:text-muted-foreground";

type Block = string | { type: "ul" | "ol"; items: string[] };
type Section = { heading: string; body: Block[] };

function SectionBlocks({ body }: { body: Block[] }) {
  return (
    <>
      {body.map((block, i) =>
        typeof block === "string" ? (
          <p key={i}>{block}</p>
        ) : block.type === "ol" ? (
          <ol key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

export default async function EaaGuidePage() {
  const t = await getTranslations("guides");
  const sections = t.raw("eaa.sections") as Section[];
  const closing = t.raw("eaa.closing.body") as Block[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("eaa.title"),
    description: t("eaa.metaDescription"),
    datePublished: PUBLISHED,
    author: { "@type": "Organization", name: "AccessAudit Pro" },
    publisher: { "@type": "Organization", name: "AccessAudit Pro" },
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        // Structured data for search engines.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="text-sm font-semibold uppercase tracking-wide text-brand">{t("eaa.eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
        {t("eaa.title")}
      </h1>

      <div className="mt-5 rounded-lg border bg-muted p-5 text-sm">
        <p className="font-medium text-[hsl(var(--foreground))]">{t("eaa.summaryLabel")}</p>
        <p className="mt-1 text-muted-foreground">{t("eaa.summary")}</p>
      </div>

      <div className={PROSE}>
        {sections.map((s) => (
          <Fragment key={s.heading}>
            <h2>{s.heading}</h2>
            <SectionBlocks body={s.body} />
          </Fragment>
        ))}
      </div>

      {/* CTA lives outside the prose wrapper so its button colors aren't overridden
          by the [&_a] descendant rule. */}
      <div className="mt-8 rounded-2xl border bg-muted/30 px-6 py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-[hsl(var(--foreground))]">{t("eaa.cta.title")}</p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{t("eaa.cta.body")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup">{t("eaa.cta.primary")}</ButtonLink>
            <ButtonLink href="/sample" variant="secondary">
              {t("eaa.cta.secondary")}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className={PROSE}>
        <h2>{t("eaa.closing.heading")}</h2>
        <SectionBlocks body={closing} />
      </div>

      <p className="mt-8 border-t pt-6 text-xs text-muted-foreground">
        <Link href="/guides" className="text-brand underline-offset-4 hover:underline">
          {t("backToGuides")}
        </Link>
      </p>
    </article>
  );
}
