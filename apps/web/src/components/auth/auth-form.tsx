"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError, FormSuccess } from "@/components/ui/form-error";

const initialState: AuthState = { error: null, message: null };

type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Working…" : label}
    </Button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  includePassword = true,
  passwordAutoComplete = "current-password",
  next,
}: {
  action: AuthAction;
  submitLabel: string;
  includePassword?: boolean;
  /** "new-password" on signup so managers generate (not autofill) a password. */
  passwordAutoComplete?: "current-password" | "new-password";
  next?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@agency.com"
        />
      </div>

      {includePassword ? (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={passwordAutoComplete}
            minLength={8}
            required
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>
      ) : null}

      <FormError error={state.error} />
      <FormSuccess message={state.message} />

      <SubmitButton label={submitLabel} />
    </form>
  );
}
