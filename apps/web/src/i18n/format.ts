/**
 * Localization helpers that bridge the locale-agnostic `@accessaudit/shared`
 * domain (consumed by the worker too, so it can't depend on i18n) to the active
 * locale's catalog. Pass in an already-scoped translator.
 */
import { isUnlimited, type ScoreTone } from "@accessaudit/shared";
import type { Translator } from "./translate";

/** Render a plan limit: a localized "Unlimited" or the locale-formatted number.
 *  `t` must be scoped to the `plans` namespace. */
export function displayLimit(value: number, t: Translator): string {
  return isUnlimited(value) ? t("unlimited") : t.number(value);
}

/** Map `scoreBand().tone` to a catalog key under `common.band`. */
const TONE_TO_BAND_KEY: Record<ScoreTone, string> = {
  success: "good",
  warning: "needsWork",
  danger: "poor",
  muted: "notScored",
};

/** Localized score-band label. `t` must be scoped to the `common.band` namespace. */
export function bandLabel(tone: ScoreTone, t: Translator): string {
  return t(TONE_TO_BAND_KEY[tone]);
}
