"use client";

import { useActionState } from "react";
import { createOrganization, type OnboardingState } from "@/app/onboarding/actions";
import { Input } from "@/components/ui/input";
import { ColorInput } from "@/components/ui/color-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";

const initialState: OnboardingState = { error: null };

export function OnboardingForm() {
  const [state, formAction] = useActionState(createOrganization, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Agency name</Label>
        <Input id="name" name="name" required placeholder="Pixel & Pine Studio" maxLength={80} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandColor">Brand color</Label>
        <div className="flex items-center gap-3">
          <ColorInput
            id="brandColor"
            name="brandColor"
            defaultValue="#4F46E5"
            aria-describedby="brandColor-hint"
          />
          <span id="brandColor-hint" className="text-sm text-muted-foreground">
            Used on your white-label reports.
          </span>
        </div>
      </div>

      <FormError error={state.error} />

      <SubmitButton className="w-full" pendingLabel="Creating…">
        Create workspace
      </SubmitButton>
    </form>
  );
}
