"use client";

import { useActionState } from "react";
import { createOrganization, type OnboardingState } from "@/app/onboarding/actions";
import { Input } from "@/components/ui/input";
import { ColorInput } from "@/components/ui/color-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { useTranslations } from "@/i18n/provider";

const initialState: OnboardingState = { error: null };

export function OnboardingForm() {
  const [state, formAction] = useActionState(createOrganization, initialState);
  const t = useTranslations("onboarding");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("agencyName")}</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={t("agencyNamePlaceholder")}
          maxLength={80}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandColor">{t("brandColor")}</Label>
        <div className="flex items-center gap-3">
          <ColorInput
            id="brandColor"
            name="brandColor"
            defaultValue="#A24425"
            aria-describedby="brandColor-hint"
          />
          <span id="brandColor-hint" className="text-sm text-muted-foreground">
            {t("brandColorHint")}
          </span>
        </div>
      </div>

      <FormError error={state.error} />

      <SubmitButton className="w-full" pendingLabel={t("creating")}>
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
