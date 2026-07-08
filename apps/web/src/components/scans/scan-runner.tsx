"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Radar, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/provider";

/**
 * The fake scan engine — a cinematic, ~10s staged "audit in progress" overlay
 * shown after the user starts a scan, before we open the finished report. Every
 * moving part (the sweeping scan line, the metric count-ups, the per-stage
 * checklist, the streaming log, the progress bar) is driven off a single
 * normalized progress value `p` (0→1) advanced by one rAF loop, so it stays
 * perfectly in sync and GPU-cheap. `prefers-reduced-motion` collapses the whole
 * sequence to a near-instant transition. Purely presentational: the scan itself
 * is already created; this component just calls `onDone()` when the show ends.
 */

type StageKey = "queue" | "browser" | "load" | "analyze" | "wcag" | "contrast" | "score" | "report";

// Relative durations (seconds) — summed and normalized so the whole run lands on
// `durationMs` exactly regardless of these weights. Tuned so the WCAG/contrast
// passes (where the interesting findings surface) get the most screen time.
const STAGES: StageKey[] = ["queue", "browser", "load", "analyze", "wcag", "contrast", "score", "report"];
const WEIGHT: Record<StageKey, number> = {
  queue: 0.7,
  browser: 1.2,
  load: 1.5,
  analyze: 1.5,
  wcag: 1.9,
  contrast: 1.4,
  score: 0.95,
  report: 0.95,
};
const TOTAL_W = STAGES.reduce((sum, k) => sum + WEIGHT[k], 0);

// Cumulative start/end fraction of each stage along the 0→1 timeline.
const START: number[] = [];
const END: number[] = [];
(() => {
  let acc = 0;
  for (const k of STAGES) {
    START.push(acc / TOTAL_W);
    acc += WEIGHT[k];
    END.push(acc / TOTAL_W);
  }
})();

const stageIcon: Record<StageKey, typeof Radar> = {
  queue: Loader2,
  browser: Loader2,
  load: Loader2,
  analyze: Loader2,
  wcag: ShieldCheck,
  contrast: Radar,
  score: Loader2,
  report: Loader2,
};

interface LogLine {
  at: number;
  text: string;
  tone: "ok" | "warn" | "info";
}

export function ScanRunner({
  projectName,
  url,
  wcagLevel,
  scanType,
  durationMs = 10_000,
  onDone,
}: {
  projectName: string;
  url: string;
  wcagLevel: string;
  scanType: "single" | "list";
  durationMs?: number;
  onDone: () => void;
}) {
  const t = useTranslations("scans");
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Believable, stable per-run metrics. Randomized once so the numbers feel real
  // yet never flicker across re-renders.
  const metrics = useMemo(() => {
    const r = (n: number) => Math.floor(Math.random() * n);
    return {
      dom: 900 + r(1400),
      elements: 130 + r(160),
      landmarks: 4 + r(5),
      headings: 8 + r(12),
      contrast: r(4),
      alt: r(3),
      chromium: 120 + r(8),
    };
  }, []);

  const logs = useMemo<LogLine[]>(() => {
    const m = metrics;
    const at = (i: number, off = 0.02) => Math.min(0.99, START[i] + off);
    const lines: LogLine[] = [
      { at: 0.01, text: `→ GET ${url}`, tone: "info" },
      { at: at(1), text: `✓ Launched headless Chromium ${m.chromium}`, tone: "ok" },
      { at: at(2), text: `✓ 200 OK · ${m.dom.toLocaleString()} DOM nodes rendered`, tone: "ok" },
      { at: at(3), text: `✓ ${m.landmarks} landmarks · ${m.headings} headings mapped`, tone: "ok" },
      { at: at(4), text: `• axe-core 4.10 · ${m.elements} elements evaluated`, tone: "info" },
      { at: at(4, 0.09), text: `✓ ARIA roles & accessible names validated`, tone: "ok" },
      {
        at: at(5),
        text: m.contrast > 0 ? `⚠ ${m.contrast} contrast pair${m.contrast > 1 ? "s" : ""} below 4.5:1` : "✓ contrast ratios pass",
        tone: m.contrast > 0 ? "warn" : "ok",
      },
      {
        at: at(5, 0.08),
        text: m.alt > 0 ? `⚠ ${m.alt} image${m.alt > 1 ? "s" : ""} missing alt text` : "✓ all images labelled",
        tone: m.alt > 0 ? "warn" : "ok",
      },
      { at: at(6), text: `✓ Weighting findings by impact`, tone: "ok" },
      { at: at(7), text: `✓ Report compiled`, tone: "ok" },
    ];
    return lines;
  }, [url, metrics]);

  // Single rAF loop drives everything. Reduced-motion collapses to a quick beat.
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 600 : Math.max(600, durationMs);
    let raf = 0;
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const next = Math.min(1, (ts - start) / dur);
      setP(next);
      if (next < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  // Hand back to the caller (which navigates to the report) a beat after the
  // "complete" flourish, so the success state is briefly seen.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => onDoneRef.current(), 700);
    return () => clearTimeout(id);
  }, [done]);

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const activeIndex = done ? STAGES.length : STAGES.findIndex((_, i) => p >= START[i] && p < END[i]);
  const activeStage = STAGES[Math.min(activeIndex, STAGES.length - 1)];
  const percent = Math.round(p * 100);
  const elapsed = ((p * durationMs) / 1000).toFixed(1);
  const elementsSeen = Math.round(p * metrics.elements);
  const visibleLogs = logs.filter((l) => p >= l.at);

  const target =
    scanType === "single"
      ? t("runner.targetOne", { level: wcagLevel })
      : t("runner.targetMany", { level: wcagLevel });

  // Auto-scroll the log to the newest line.
  const logRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLogs.length]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("runner.title")}
      aria-busy={!done}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" aria-hidden="true" />

      <div className="glass-panel lux-rim animate-rise-in relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border p-5 shadow-xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-colors",
                done
                  ? "bg-success/12 text-success-strong ring-success/25"
                  : "bg-gold/12 text-gold-strong ring-gold/25",
              )}
            >
              {!done ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 hidden rounded-xl bg-gold/[0.12] blur-lg dark:block"
                />
              ) : null}
              {done ? (
                <ShieldCheck className="relative h-5 w-5" aria-hidden="true" />
              ) : (
                <Radar className="relative h-5 w-5 animate-spin-slow" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">
                {done ? t("runner.complete") : t("runner.scanning", { project: projectName })}
              </p>
              <p className="truncate text-xs text-muted-foreground">{target}</p>
            </div>
          </div>
          <div className="shrink-0 text-end">
            <p className={cn("text-2xl font-bold tabular-nums", done ? "text-success-strong" : "text-gold-strong")}>
              {percent}%
            </p>
            <p className="text-[11px] text-muted-foreground">{done ? t("runner.openingReport") : `${elapsed}s`}</p>
          </div>
        </div>

        {/* Faux browser viewport with a progress-linked scan line */}
        <div className="mt-5 overflow-hidden rounded-xl border bg-muted/40">
          <div className="flex items-center gap-1.5 border-b bg-background/60 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" aria-hidden="true" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" aria-hidden="true" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" aria-hidden="true" />
            <span className="ms-2 flex-1 truncate rounded-md bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              {url}
            </span>
            {!done ? <span className="live-dot ms-1" aria-hidden="true" /> : null}
          </div>
          <div className="relative h-32 overflow-hidden p-4">
            {/* Skeleton page content */}
            <div className="space-y-2.5" aria-hidden="true">
              <div className="h-3 w-1/3 rounded bg-foreground/10" />
              <div className="h-2.5 w-4/5 rounded bg-foreground/[0.07]" />
              <div className="h-2.5 w-3/5 rounded bg-foreground/[0.07]" />
              <div className="mt-3 flex gap-2">
                <div className="h-9 w-24 rounded-md bg-brand/15" />
                <div className="h-9 w-16 rounded-md bg-foreground/[0.06]" />
              </div>
            </div>
            {/* Detected-element highlight boxes — reveal as the scan line passes */}
            {DETECTIONS.map((d, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={cn(
                  "absolute rounded-md border-2 transition-opacity duration-300",
                  d.tone === "warn" ? "border-warning/70 bg-warning/10" : "border-gold/70 bg-gold/10",
                  p >= d.at && !done ? "opacity-100" : "opacity-0",
                )}
                style={{ left: d.x, top: d.y, width: d.w, height: d.h }}
              />
            ))}
            {/* The scan line — its vertical position IS the progress. */}
            {!done ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-16 -translate-y-1/2 bg-[linear-gradient(180deg,transparent,hsl(var(--gold)/0.16)_45%,hsl(var(--gold)/0.5)_50%,hsl(var(--gold)/0.16)_55%,transparent)]"
                style={{ top: `${p * 100}%` }}
              />
            ) : null}
          </div>
        </div>

        {/* Live metric chips */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Stat label={t("runner.elementsLabel")} value={elementsSeen.toLocaleString()} />
          <Stat label={t("runner.elapsedLabel")} value={`${elapsed}s`} />
          <Stat label={t("impact.serious")} value={String(visibleLogs.filter((l) => l.tone === "warn").length)} tone="warn" />
        </div>

        {/* Stage checklist */}
        <ul className="mt-4 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {STAGES.map((key, i) => {
            const status = done || p >= END[i] ? "done" : p >= START[i] ? "active" : "pending";
            const Icon = stageIcon[key];
            return (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  status === "active" && "bg-gold/8",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition-colors",
                    status === "done" && "bg-success/15 text-success-strong ring-success/30",
                    status === "active" && "bg-gold/15 text-gold-strong ring-gold/30",
                    status === "pending" && "text-muted-foreground/60 ring-border",
                  )}
                >
                  {status === "done" ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : status === "active" ? (
                    <Icon className="h-3 w-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  )}
                </span>
                <span
                  className={cn(
                    "truncate",
                    status === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
                  )}
                >
                  {t(`runner.stages.${key}`)}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Streaming console log */}
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("runner.consoleLabel")}
          </p>
          <ul
            ref={logRef}
            className="h-24 space-y-1 overflow-hidden rounded-lg border bg-background/50 p-3 font-mono text-xs"
          >
            {visibleLogs.map((l, i) => (
              <li
                key={i}
                className={cn(
                  "animate-fade-in",
                  l.tone === "warn" ? "text-warning-strong" : l.tone === "ok" ? "text-success-strong" : "text-muted-foreground",
                )}
              >
                {l.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-foreground/5">
          <div
            className={cn(
              "lux-sheen h-full rounded-full shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.25)] transition-[width] duration-200 ease-out",
              done ? "bg-success" : "bg-gold",
            )}
            style={{ width: `${Math.max(3, percent)}%` }}
          />
        </div>

        {/* SR-only live announcements (stage changes only, to avoid chatter). */}
        <p role="status" aria-live="polite" className="sr-only">
          {t("runner.liveStatus", { stage: t(`runner.stages.${activeStage}`), percent })}
        </p>
      </div>
    </div>
  );
}

/** Highlight boxes over the faux viewport, revealed as the scan line passes their `at`. */
const DETECTIONS: Array<{ at: number; x: string; y: string; w: string; h: string; tone: "warn" | "ok" }> = [
  { at: 0.18, x: "16px", y: "16px", w: "34%", h: "16px", tone: "ok" },
  { at: 0.46, x: "16px", y: "84px", w: "96px", h: "36px", tone: "warn" },
  { at: 0.66, x: "120px", y: "84px", w: "64px", h: "36px", tone: "ok" },
];

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg border bg-background/50 px-3 py-2 text-center">
      <p className={cn("text-lg font-bold tabular-nums", tone === "warn" ? "text-warning-strong" : "text-foreground")}>
        {value}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
