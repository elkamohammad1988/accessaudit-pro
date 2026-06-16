"use client";

import { useActionState } from "react";
import type { Organization } from "@accessaudit/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
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
        <p id="slug-hint" className="text-xs text-[hsl(var(--muted-foreground))]">
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
            className="h-10 w-14 cursor-pointer rounded-md border bg-transparent"
            aria-describedby="brandColor-hint"
          />
          <span id="brandColor-hint" className="text-sm text-[hsl(var(--muted-foreground))]">
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
        <p id="logoUrl-hint" className="text-xs text-[hsl(var(--muted-foreground))]">
          Shown on branded reports. Paste a hosted image URL.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-green-600">
          Workspace saved.
        </p>
      ) : null}

      <SubmitButton>Save workspace</SubmitButton>
    </form>
  );
}
