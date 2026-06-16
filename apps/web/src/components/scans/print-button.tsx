"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-fg hover:opacity-90"
    >
      Print / Save as PDF
    </button>
  );
}
