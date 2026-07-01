"use client";

import { useActionState } from "react";
import { useTranslations } from "@/i18n/provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { updateProfile, type SettingsState } from "@/app/(app)/settings/actions";

const initialState: SettingsState = { error: null, ok: false };

export function ProfileForm({
  email,
  fullName,
  avatarUrl,
}: {
  email: string | undefined;
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const t = useTranslations("settings");
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("profile.emailLabel")}</Label>
        <Input id="email" value={email ?? ""} disabled readOnly />
        <p className="text-xs text-muted-foreground">{t("profile.emailHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("profile.fullNameLabel")}</Label>
        <Input
          id="fullName"
          name="fullName"
          maxLength={120}
          defaultValue={fullName ?? ""}
          placeholder={t("profile.fullNamePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">{t("profile.avatarUrlLabel")}</Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={avatarUrl ?? ""}
          placeholder={t("profile.avatarUrlPlaceholder")}
        />
      </div>

      <FormError error={state.error} />
      <FormSuccess message={state.ok ? t("profile.saved") : null} />

      <SubmitButton>{t("profile.submit")}</SubmitButton>
    </form>
  );
}
