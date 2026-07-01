"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormError } from "@/components/ui/form-error";
import { createScan, type NewScanState } from "@/app/(app)/scans/actions";
import { useTranslations } from "@/i18n/provider";

export interface ProjectOption {
  id: string;
  name: string;
  base_url: string;
}

const initialState: NewScanState = { error: null };

export function NewScanForm({
  projects,
  defaultProjectId,
  pagesPerScan,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
  pagesPerScan: number;
}) {
  const t = useTranslations("scans.new.form");
  const [state, formAction] = useActionState(createScan, initialState);
  const [projectId, setProjectId] = useState(
    defaultProjectId && projects.some((p) => p.id === defaultProjectId)
      ? defaultProjectId
      : (projects[0]?.id ?? ""),
  );
  const [scanType, setScanType] = useState<"single" | "list">("single");

  const selected = projects.find((p) => p.id === projectId);
  const multiAllowed = pagesPerScan > 1;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="projectId">{t("project")}</Label>
        <Select
          id="projectId"
          name="projectId"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} — {project.base_url}
            </option>
          ))}
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium leading-none">{t("scope")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-background p-3.5 shadow-xs transition-all hover:border-foreground/25 has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:checked]:ring-1 has-[:checked]:ring-brand">
            <input
              type="radio"
              name="scanType"
              value="single"
              checked={scanType === "single"}
              onChange={() => setScanType("single")}
              className="mt-0.5 accent-brand"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">{t("singlePageTitle")}</span>
              <span className="block text-xs text-muted-foreground">{t("singlePageDesc")}</span>
            </span>
          </label>
          <label
            className={`flex items-start gap-3 rounded-lg border border-input bg-background p-3.5 shadow-xs transition-all has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:checked]:ring-1 has-[:checked]:ring-brand ${
              multiAllowed ? "cursor-pointer hover:border-foreground/25" : "cursor-not-allowed opacity-60"
            }`}
          >
            <input
              type="radio"
              name="scanType"
              value="list"
              checked={scanType === "list"}
              onChange={() => setScanType("list")}
              disabled={!multiAllowed}
              className="mt-0.5 accent-brand"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">{t("urlListTitle")}</span>
              <span className="block text-xs text-muted-foreground">
                {multiAllowed ? t.plural("urlListDesc", pagesPerScan) : t("urlListUpgrade")}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {scanType === "single" ? (
        <div className="space-y-2">
          <Label htmlFor="singleUrl">{t("url")}</Label>
          <Input
            // key on projectId so the uncontrolled input remounts with the new
            // project's base_url when the project changes (defaultValue alone only
            // applies on first mount — without this it would keep the old URL).
            key={projectId}
            id="singleUrl"
            name="singleUrl"
            inputMode="url"
            placeholder={selected?.base_url ?? "https://example.com"}
            defaultValue={selected?.base_url ?? ""}
          />
          <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="urlList">{t("urls")}</Label>
          <Textarea
            id="urlList"
            name="urlList"
            rows={6}
            placeholder={`${selected?.base_url ?? "https://example.com"}\n${selected?.base_url ?? "https://example.com"}/about`}
          />
          <p className="text-xs text-muted-foreground">{t.plural("urlsHint", pagesPerScan)}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="wcagLevel">{t("wcagTarget")}</Label>
        <Select id="wcagLevel" name="wcagLevel" defaultValue="AA" className="max-w-xs">
          <option value="A">{t("wcagA")}</option>
          <option value="AA">{t("wcagAA")}</option>
          <option value="AAA">{t("wcagAAA")}</option>
        </Select>
      </div>

      {/* Authorization attestation — scanning fetches a third-party site, so the
          user must confirm they're entitled to audit it. `required` makes the
          browser block submission (and the server action) until it's checked. */}
      <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="authorized"
          required
          value="yes"
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        />
        <span>{t("authorizationLabel")}</span>
      </label>

      <FormError error={state.error} upgrade={state.upgrade} />

      <SubmitButton pendingLabel={t("submitPending")}>{t("submit")}</SubmitButton>
    </form>
  );
}
