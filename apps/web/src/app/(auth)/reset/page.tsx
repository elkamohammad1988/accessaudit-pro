import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
  };
}

export default async function ResetPage() {
  const t = await getTranslations("auth.reset");
  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AuthForm action={requestPasswordReset} submitLabel={t("submit")} includePassword={false} />

      <p className="text-center text-sm">
        <Link href="/login" className="underline-offset-4 hover:underline">
          {t("backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
