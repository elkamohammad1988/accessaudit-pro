"use client";

import { useActionState } from "react";
import type { Project } from "@accessaudit/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
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
  submitLabel = "Save project",
}: {
  action: (prev: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  clients: ClientOption[];
  project?: Project;
  defaultClientId?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const selectedClient = project?.client_id ?? defaultClientId ?? "";

  return (
    <form action={formAction} className="space-y-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <Select id="clientId" name="clientId" required defaultValue={selectedClient}>
          <option value="" disabled>
            Select a client…
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={project?.name ?? ""}
          placeholder="Marketing site"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrl">Website URL</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          inputMode="url"
          defaultValue={project?.base_url ?? ""}
          placeholder="https://example.com"
          aria-describedby="baseUrl-hint"
        />
        <span id="baseUrl-hint" className="text-xs text-[hsl(var(--muted-foreground))]">
          The base address of the site you want to audit.
        </span>
      </div>

      <FormError error={state.error} upgrade={state.upgrade} />

      <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
