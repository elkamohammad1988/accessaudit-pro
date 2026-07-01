/** Start of the current UTC month as an ISO string — the billing-period boundary. */
export function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Map an app locale to the BCP-47 tag used for date formatting. English keeps
 *  the day-month-year style (e.g. "20 Jun 2026"); others use their own convention. */
const DATE_LOCALE: Record<string, string> = {
  en: "en-GB",
  fr: "fr-FR",
  ar: "ar",
  es: "es-ES",
  zh: "zh-CN",
};

/** Compact date label localized to the active language, e.g. "20 Jun 2026, 14:32". */
export function formatDateTime(iso: string | null | undefined, locale = "en"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(DATE_LOCALE[locale] ?? "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
