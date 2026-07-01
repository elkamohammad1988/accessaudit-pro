"use client";

import { useActionState } from "react";
import type { Client } from "@accessaudit/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { useTranslations } from "@/i18n/provider";
import type { ClientFormState } from "@/app/(app)/clients/actions";

const initialState: ClientFormState = { error: null };

export function ClientForm({
  action,
  client,
  submitLabel,
}: {
  action: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  client?: Client;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const t = useTranslations("clients");

  return (
    <form action={formAction} className="space-y-4">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="name">{t("form.name")}</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={client?.name ?? ""}
          placeholder={t("form.namePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">{t("form.contactEmail")}</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          maxLength={160}
          defaultValue={client?.contact_email ?? ""}
          placeholder={t("form.contactEmailPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("form.notes")}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={client?.notes ?? ""}
          placeholder={t("form.notesPlaceholder")}
        />
      </div>

      <FormError error={state.error} upgrade={state.upgrade} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
