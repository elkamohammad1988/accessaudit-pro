import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { resendConfirmation, signIn } from "../actions";
import { AuthForm } from "@/components/auth/auth-form";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const t = await getTranslations("auth.login");
  // `expired_link` → the confirmation/reset link is no longer valid (e.g.
  // otp_expired). Offer a one-click resend. `auth_callback` → a generic failure.
  const expired = error === "expired_link";
  const failed = error === "auth_callback";

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {expired ? (
        <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="flex items-start gap-2 text-sm font-medium text-warning-strong">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t("expiredTitle")}
          </p>
          <p className="text-sm text-muted-foreground">{t("expiredBody")}</p>
          <AuthForm
            action={resendConfirmation}
            submitLabel={t("resendSubmit")}
            includePassword={false}
          />
        </div>
      ) : null}

      {failed ? <NoticeBanner tone="error">{t("failedNotice")}</NoticeBanner> : null}

      <AuthForm action={signIn} submitLabel={t("submit")} next={next} />

      <div className="flex items-center justify-between text-sm">
        <Link href="/reset" className="underline-offset-4 hover:underline">
          {t("forgot")}
        </Link>
        <Link href="/signup" className="underline-offset-4 hover:underline">
          {t("createAccount")}
        </Link>
      </div>
    </div>
  );
}
