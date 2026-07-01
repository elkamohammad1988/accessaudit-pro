import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "@/i18n/server";
import { ClientForm } from "@/components/clients/client-form";
import { createClientRecord } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clients");
  return { title: t("metaNew") };
}

export default async function NewClientPage() {
  const t = await getTranslations("clients");
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("title")}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("newIntro")}</p>
      </div>
      <ClientForm action={createClientRecord} submitLabel={t("createSubmit")} />
    </div>
  );
}
