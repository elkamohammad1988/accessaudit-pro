"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOrganization, type OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnboardingState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating…" : "Create workspace"}
    </Button>
  );
}

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
          <input
            id="brandColor"
            name="brandColor"
            type="color"
            defaultValue="#4F46E5"
            className="h-10 w-14 cursor-pointer rounded-md border bg-transparent"
            aria-describedby="brandColor-hint"
          />
          <span id="brandColor-hint" className="text-sm text-[hsl(var(--muted-foreground))]">
            Used on your white-label reports.
          </span>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
