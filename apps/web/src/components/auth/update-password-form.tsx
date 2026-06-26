"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword } from "@/app/(auth)/actions";
import type { AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError, FormSuccess } from "@/components/ui/form-error";

const initialState: AuthState = { error: null, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Set new password"}
    </Button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="At least 8 characters"
        />
      </div>

      <FormError error={state.error} />
      <FormSuccess message={state.message} />

      <SubmitButton />
    </form>
  );
}
