"use client";

import { useActionState } from "react";
import type { Organization } from "@accessaudit/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { updateOrganization, type SettingsState } from "@/app/(app)/settings/actions";

const initialState: SettingsState = { error: null, ok: false };

export function OrganizationForm({ organization }: { organization: Organization }) {
  const [state, formAction] = useActionState(updateOrganization, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Agency name</Label>
        <Input id="name" name="name" required maxLength={80} defaultValue={organization.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Workspace URL slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          maxLength={48}
          defaultValue={organization.slug}
          aria-describedby="slug-hint"
        />
        <p id="slug-hint" className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. Used in links and public reports.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandColor">Brand color</Label>
        <div className="flex items-center gap-3">
          <input
            id="brandColor"
            name="brandColor"
            type="color"
            defaultValue={organization.brand_color}
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1 shadow-xs transition-colors hover:border-foreground/25 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0"
            aria-describedby="brandColor-hint"
          />
          <span id="brandColor-hint" className="text-sm text-muted-foreground">
            Applied to your white-label reports.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={organization.logo_url ?? ""}
          placeholder="https://…/logo.png"
          aria-describedby="logoUrl-hint"
        />
        <p id="logoUrl-hint" className="text-xs text-muted-foreground">
          Shown on branded reports. Paste a hosted image URL.
        </p>
      </div>

      <FormError error={state.error} />
      <FormSuccess message={state.ok ? "Workspace saved." : null} />

      <SubmitButton>Save workspace</SubmitButton>
    </form>
  );
}
