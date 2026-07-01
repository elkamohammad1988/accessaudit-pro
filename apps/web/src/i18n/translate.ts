/**
 * The translation engine — shared verbatim by the server (`getTranslations`) and
 * the client (`useTranslations`) so both resolve keys identically.
 *
 * Features kept deliberately small but production-complete:
 *  - dotted-path lookup into nested message objects (`scans.status.running`)
 *  - `{name}` interpolation, with numbers auto-formatted for the active locale
 *  - CLDR-correct pluralization via `Intl.PluralRules` (Arabic needs six forms;
 *    a naive `n === 1 ? a : b` would be wrong in several supported languages)
 *  - array access for repeated content (FAQ lists, feature bullets)
 *
 * A missing key returns the key itself — a loud, greppable signal in dev rather
 * than a silent blank. Catalogs are kept in sync by the `i18n:check` discipline
 * (every locale mirrors `en`), so this should never fire in practice.
 */
import type { Locale } from "./config";

export type MessageNode = string | MessageTree | MessageNode[];
export interface MessageTree {
  [key: string]: MessageNode;
}

export type TranslationValues = Record<string, string | number>;

/** A pluralizable message: one entry per CLDR category the language uses. */
export type PluralMessage = Partial<
  Record<"zero" | "one" | "two" | "few" | "many" | "other", string>
> & { other: string };

export interface Translator {
  /** Resolve `key` to a string, interpolating `{values}`. */
  (key: string, values?: TranslationValues): string;
  /** Resolve a plural message by `count`, exposing `{count}` to the template. */
  plural(key: string, count: number, values?: TranslationValues): string;
  /** Resolve a key whose value is a string array (e.g. a list of bullets). */
  array(key: string): string[];
  /** Resolve a key to its raw node (object/array/string) — for structured data. */
  raw(key: string): MessageNode | undefined;
  /** Whether a string exists for `key` (lets callers fall back gracefully). */
  has(key: string): boolean;
  /** Format a number for the active locale (grouping, numerals). */
  number(value: number): string;
  /** The active locale, for callers that need it (e.g. date formatting). */
  locale: Locale;
}

function resolve(tree: MessageNode | undefined, key: string): MessageNode | undefined {
  if (key === "") return tree;
  let node: MessageNode | undefined = tree;
  for (const part of key.split(".")) {
    if (node == null || typeof node === "string" || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return node;
}

/**
 * Narrow a catalog to a (possibly dotted) namespace — e.g. "auth.messages" or
 * "common.band". Returns an empty object for an unknown path so a translator can
 * still be built (its lookups will fall back to returning the key).
 */
export function scopeMessages(messages: MessageNode, namespace?: string): MessageNode {
  if (!namespace) return messages;
  const node = resolve(messages, namespace);
  return node == null ? {} : node;
}

function interpolate(
  template: string,
  values: TranslationValues | undefined,
  numberFormat: Intl.NumberFormat,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    if (!(name in values)) return match;
    const value = values[name];
    return typeof value === "number" ? numberFormat.format(value) : String(value);
  });
}

/**
 * Build a translator bound to a flattened message tree (already scoped to a
 * namespace by the caller, or the whole catalog for global lookups).
 */
export function createTranslator(messages: MessageNode, locale: Locale): Translator {
  // `Intl` formatters are comparatively expensive to construct — build once per
  // translator and reuse across every call.
  const numberFormat = new Intl.NumberFormat(locale);
  const pluralRules = new Intl.PluralRules(locale);

  const t = ((key: string, values?: TranslationValues): string => {
    const node = resolve(messages, key);
    if (typeof node !== "string") return key;
    return interpolate(node, values, numberFormat);
  }) as Translator;

  t.locale = locale;

  t.has = (key) => typeof resolve(messages, key) === "string";

  t.raw = (key) => resolve(messages, key);

  t.number = (value) => numberFormat.format(value);

  t.array = (key) => {
    const node = resolve(messages, key);
    return Array.isArray(node) ? node.filter((n): n is string => typeof n === "string") : [];
  };

  t.plural = (key, count, values) => {
    const node = resolve(messages, key);
    if (node == null || typeof node === "string" || Array.isArray(node)) return key;
    const category = pluralRules.select(count);
    const template = (node[category] ?? node.other) as string | undefined;
    if (typeof template !== "string") return key;
    return interpolate(template, { count, ...values }, numberFormat);
  };

  return t;
}
