"use client";

import { useActionState } from "react";
import type { Organization } from "@accessaudit/database";
import { useTranslations } from "@/i18n/provider";
import { Input } from "@/components/ui/input";
import { ColorInput } from "@/components/ui/color-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { updateOrganization, type SettingsState } from "@/app/(app)/settings/actions";

const initialState: SettingsState = { error: null, ok: false };

export function OrganizationForm({ organization }: { organization: Organization }) {
  const t = useTranslations("settings");
  const [state, formAction] = useActionState(updateOrganization, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("workspace.nameLabel")}</Label>
        <Input id="name" name="name" required maxLength={80} defaultValue={organization.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t("workspace.slugLabel")}</Label>
        <Input
          id="slug"
          name="slug"
          required
          maxLength={48}
          defaultValue={organization.slug}
          aria-describedby="slug-hint"
        />
        <p id="slug-hint" className="text-xs text-muted-foreground">
          {t("workspace.slugHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandColor">{t("workspace.brandColorLabel")}</Label>
        <div className="flex items-center gap-3">
          <ColorInput
            id="brandColor"
            name="brandColor"
            defaultValue={organization.brand_color}
            aria-describedby="brandColor-hint"
          />
          <span id="brandColor-hint" className="text-sm text-muted-foreground">
            {t("workspace.brandColorHint")}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">{t("workspace.logoUrlLabel")}</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={organization.logo_url ?? ""}
          placeholder={t("workspace.logoUrlPlaceholder")}
          aria-describedby="logoUrl-hint"
        />
        <p id="logoUrl-hint" className="text-xs text-muted-foreground">
          {t("workspace.logoUrlHint")}
        </p>
      </div>

      <FormError error={state.error} />
      <FormSuccess message={state.ok ? t("workspace.saved") : null} />

      <SubmitButton>{t("workspace.submit")}</SubmitButton>
    </form>
  );
}
