import type { Metadata } from "next";
import { Home, Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { IconChip } from "@/components/ui/icon-chip";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors.notFound");
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function NotFound() {
  const t = await getTranslations("errors.notFound");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <IconChip icon={Compass} tone="brand" size="lg" glow />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <ButtonLink href="/" className="mt-2">
        <Home className="h-4 w-4" aria-hidden="true" />
        {t("home")}
      </ButtonLink>
    </main>
  );
}
