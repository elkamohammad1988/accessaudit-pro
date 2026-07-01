import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/privacy" },
  };
}

// Fixed publication date; bump on change. The prose lives in
// `src/i18n/messages/en/legal.json` under `privacy`; confirm your registered
// trading entity there and adjust the contact address below.
const EFFECTIVE_DATE = "28 June 2026";
const CONTACT_EMAIL = "privacy@accessaudit.pro";

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

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");
  const sections = t.raw("sections") as Section[];

  return (
    <>
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{t("title")}</h1>
      <p>{t("effective", { date: EFFECTIVE_DATE })}</p>

      <p>{t("intro")}</p>

      {sections.map((s) => (
        <Fragment key={s.heading}>
          <h2>{s.heading}</h2>
          <SectionBlocks body={s.body} />
        </Fragment>
      ))}

      <h2>{t("contact.heading")}</h2>
      <p>
        {t("contact.before")}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        {t("contact.after")}
      </p>
    </>
  );
}
