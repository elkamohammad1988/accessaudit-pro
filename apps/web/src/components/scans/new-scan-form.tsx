"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { createScan, type NewScanState } from "@/app/(app)/scans/actions";

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
        <Label htmlFor="projectId">Project</Label>
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
        <legend className="text-sm font-medium leading-none">Scope</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="scanType"
              value="single"
              checked={scanType === "single"}
              onChange={() => setScanType("single")}
            />
            Single page
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="scanType"
              value="list"
              checked={scanType === "list"}
              onChange={() => setScanType("list")}
              disabled={!multiAllowed}
            />
            URL list{" "}
            {multiAllowed ? (
              <span className="text-[hsl(var(--muted-foreground))]">(up to {pagesPerScan})</span>
            ) : (
              <span className="text-[hsl(var(--muted-foreground))]">(upgrade to scan multiple)</span>
            )}
          </label>
        </div>
      </fieldset>

      {scanType === "single" ? (
        <div className="space-y-2">
          <Label htmlFor="singleUrl">URL</Label>
          <Input
            id="singleUrl"
            name="singleUrl"
            inputMode="url"
            placeholder={selected?.base_url ?? "https://example.com"}
            defaultValue={selected?.base_url ?? ""}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Defaults to the project&apos;s base URL. Change it to scan a specific page.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="urlList">URLs</Label>
          <Textarea
            id="urlList"
            name="urlList"
            rows={6}
            placeholder={`${selected?.base_url ?? "https://example.com"}\n${selected?.base_url ?? "https://example.com"}/about`}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            One URL per line, up to {pagesPerScan} pages on your plan.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="wcagLevel">WCAG target</Label>
        <Select id="wcagLevel" name="wcagLevel" defaultValue="AA" className="max-w-xs">
          <option value="A">WCAG 2.2 — Level A</option>
          <option value="AA">WCAG 2.2 — Level AA (recommended)</option>
          <option value="AAA">WCAG 2.2 — Level AAA</option>
        </Select>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Starting scan…">Start scan</SubmitButton>
    </form>
  );
}
