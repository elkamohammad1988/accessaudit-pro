import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guides.index");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/guides" },
  };
}

// Hrefs stay in code (locale-agnostic) and pair with the translated `items`
// array by position.
const GUIDE_HREFS = [
  "/guides/european-accessibility-act",
  "/guides/wcag-2-2-aa-checklist",
] as const;

export default async function GuidesPage() {
  const t = await getTranslations("guides.index");
  const items = t.raw("items") as { title: string; summary: string }[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("intro")}</p>
      <ul className="mt-8 space-y-4">
        {items.map((g, i) => {
          const href = GUIDE_HREFS[i] ?? GUIDE_HREFS[0];
          return (
            <li key={href}>
              <Card interactive className="group p-5">
                <Link href={href} className="block">
                  <IconChip icon={BookOpen} tone="brand" size="md" glow />
                  <h2 className="mt-4 text-lg font-semibold">{g.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{g.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand">
                    {t("readGuide")}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
