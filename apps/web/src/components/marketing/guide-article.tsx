import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getTranslations } from "@/i18n/server";

/** The two long-form guides share one layout; only the translation sub-namespace,
 *  canonical path, and publish date differ. This component is the single source. */
export type GuideSlug = "eaa" | "wcag";

type Block = string | { type: "ul" | "ol"; items: string[] };
type Section = { heading: string; body: Block[] };

// Long-form prose treatment, shared with the legal pages but warmed for the
// marketing surface: gold-accented links and list markers, headings in the
// display serif so a guide reads like an edited article, not a settings pane.
const PROSE =
  "mt-8 space-y-4 text-[15px] leading-relaxed [&_h2]:font-display [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[hsl(var(--foreground))] [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-[hsl(var(--foreground))] [&_a]:font-medium [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline dark:[&_a]:text-gold-strong [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-6 [&_ul]:marker:text-gold [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-6 [&_ol]:marker:text-muted-foreground [&_p]:text-muted-foreground [&_li]:text-muted-foreground";

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

/** Shared `generateMetadata` for a guide page. */
export async function guideMetadata(slug: GuideSlug, path: string): Promise<Metadata> {
  const t = await getTranslations(`guides.${slug}`);
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", title, description, url: path },
  };
}

export async function GuideArticle({
  slug,
  published,
}: {
  slug: GuideSlug;
  /** ISO date for the Article JSON-LD `datePublished`. */
  published: string;
}) {
  const t = await getTranslations("guides");
  const k = (key: string) => `${slug}.${key}`;
  const sections = t.raw(k("sections")) as Section[];
  const closing = t.raw(k("closing.body")) as Block[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(k("title")),
    description: t(k("metaDescription")),
    datePublished: published,
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

      {/* Editorial running-head — a mono index with a short gold rule, the same
          eyebrow rhythm the landing sections use. */}
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.24em] text-gold-strong">
        <span className="h-px w-8 bg-gold/40" aria-hidden="true" />
        <span>{t(k("eyebrow"))}</span>
      </div>
      <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-[2.75rem] sm:leading-[1.05]">
        {t(k("title"))}
      </h1>

      {/* Summary callout — a lit gold-rimmed card, the article's "abstract". */}
      <div className="lux-rim mt-8 rounded-xl border bg-card/60 p-5 text-sm shadow-sm dark:border-gold/15">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold-strong">
          {t(k("summaryLabel"))}
        </p>
        <p className="mt-2 leading-relaxed text-muted-foreground">{t(k("summary"))}</p>
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
      <div className="lux-rim mt-10 rounded-2xl border bg-card/40 px-6 py-10 text-center dark:border-gold/15">
        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            {t(k("cta.title"))}
          </p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{t(k("cta.body"))}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup">{t(k("cta.primary"))}</ButtonLink>
            <ButtonLink href="/sample" variant="secondary">
              {t(k("cta.secondary"))}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className={PROSE}>
        <h2>{t(k("closing.heading"))}</h2>
        <SectionBlocks body={closing} />
      </div>

      <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
        <Link
          href="/guides"
          className="text-brand underline-offset-4 hover:underline dark:text-gold-strong"
        >
          {t("backToGuides")}
        </Link>
      </p>
    </article>
  );
}
