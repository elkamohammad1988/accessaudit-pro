"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
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
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email ?? ""} disabled readOnly />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Sign-in email — change it from your auth provider.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" maxLength={120} defaultValue={fullName ?? ""} placeholder="Jane Doe" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={avatarUrl ?? ""}
          placeholder="https://…/avatar.png"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-sm text-green-600">
          Profile saved.
        </p>
      ) : null}

      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
