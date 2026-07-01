"use client";

import { useActionState } from "react";
import type { Project } from "@accessaudit/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { useTranslations } from "@/i18n/provider";
import type { ProjectFormState } from "@/app/(app)/projects/actions";

const initialState: ProjectFormState = { error: null };

export interface ClientOption {
  id: string;
  name: string;
}

export function ProjectForm({
  action,
  clients,
  project,
  defaultClientId,
  submitLabel,
}: {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  clients: ClientOption[];
  project?: Project;
  defaultClientId?: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const t = useTranslations("projects");
  const selectedClient = project?.client_id ?? defaultClientId ?? "";

  return (
    <form action={formAction} className="space-y-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="clientId">{t("form.client")}</Label>
        <Select id="clientId" name="clientId" required defaultValue={selectedClient}>
          <option value="" disabled>
            {t("form.selectClient")}
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("form.name")}</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={project?.name ?? ""}
          placeholder={t("form.namePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrl">{t("form.websiteUrl")}</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          inputMode="url"
          defaultValue={project?.base_url ?? ""}
          placeholder={t("form.websiteUrlPlaceholder")}
          aria-describedby="baseUrl-hint"
        />
        <span id="baseUrl-hint" className="text-xs text-muted-foreground">
          {t("form.websiteUrlHint")}
        </span>
      </div>

      <FormError error={state.error} upgrade={state.upgrade} />

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
