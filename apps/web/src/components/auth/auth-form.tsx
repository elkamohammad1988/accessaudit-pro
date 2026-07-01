"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingField } from "@/components/ui/floating-field";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { useTranslations } from "@/i18n/provider";

const initialState: AuthState = { error: null, message: null };

type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations("auth.form");
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t("working") : label}
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
  const t = useTranslations("auth.form");

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FloatingField id="email" label={t("email")}>
        <Input name="email" type="email" autoComplete="email" required />
      </FloatingField>

      {includePassword ? (
        <FloatingField id="password" label={t("password")} hint={t("passwordHint")}>
          <Input
            name="password"
            type="password"
            autoComplete={passwordAutoComplete}
            minLength={8}
            required
          />
        </FloatingField>
      ) : null}

      <FormError error={state.error} />
      <FormSuccess message={state.message} />

      <SubmitButton label={submitLabel} />
    </form>
  );
}
