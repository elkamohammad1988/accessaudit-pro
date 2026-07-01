"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword } from "@/app/(auth)/actions";
import type { AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingField } from "@/components/ui/floating-field";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { useTranslations } from "@/i18n/provider";

const initialState: AuthState = { error: null, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth.updatePassword");
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t("saving") : t("submit")}
    </Button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);
  const t = useTranslations("auth.updatePassword");

  return (
    <form action={formAction} className="space-y-4">
      <FloatingField id="password" label={t("newPassword")}>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </FloatingField>

      <FormError error={state.error} />
      <FormSuccess message={state.message} />

      <SubmitButton />
    </form>
  );
}
