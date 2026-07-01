/**
 * i18n parity check — every locale must mirror the English catalog's key set
 * exactly (same namespaces, keys, nesting, and placeholder tokens). Run with:
 *   node apps/web/scripts/i18n-check.mjs
 * Exits non-zero on any missing/extra key or placeholder mismatch.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const MESSAGES = join(here, "..", "src", "i18n", "messages");
const REFERENCE = "en";

const placeholders = (s) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");

// CLDR plural categories are language-specific: Chinese uses only `other`, Arabic
// adds zero/two/few/many. A key whose LAST segment is one of these optional
// categories may legitimately be absent (or extra) in a given locale — only
// `other` is universally required. So we never flag those as missing/extra.
const OPTIONAL_PLURAL = new Set(["zero", "one", "two", "few", "many"]);
const isOptionalPlural = (key) => OPTIONAL_PLURAL.has(key.split(".").pop());

/** Flatten a message tree into "path -> placeholderSignature" leaf entries. */
function flatten(node, prefix, out) {
  if (typeof node === "string") {
    out.set(prefix, placeholders(node));
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

function loadLocale(locale) {
  const dir = join(MESSAGES, locale);
  const tree = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const ns = file.replace(/\.json$/, "");
    tree[ns] = JSON.parse(readFileSync(join(dir, file), "utf8"));
  }
  return tree;
}

const locales = readdirSync(MESSAGES).filter((d) => existsSync(join(MESSAGES, d)) && d !== REFERENCE && !d.endsWith(".ts"));
const ref = flatten(loadLocale(REFERENCE), "", new Map());

let failures = 0;
for (const locale of locales) {
  const cur = flatten(loadLocale(locale), "", new Map());
  const missing = [...ref.keys()].filter((k) => !cur.has(k) && !isOptionalPlural(k));
  const extra = [...cur.keys()].filter((k) => !ref.has(k) && !isOptionalPlural(k));
  // Placeholder mismatches: ignore plural sub-keys (zero/two/few/many add {count} freely).
  const placeholderMismatch = [...ref.keys()].filter((k) => {
    if (!cur.has(k)) return false;
    return ref.get(k) !== cur.get(k);
  });

  if (missing.length || extra.length || placeholderMismatch.length) {
    failures++;
    console.error(`\n✗ ${locale}`);
    if (missing.length) console.error(`  missing (${missing.length}): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? " …" : ""}`);
    if (extra.length) console.error(`  extra (${extra.length}): ${extra.slice(0, 20).join(", ")}${extra.length > 20 ? " …" : ""}`);
    if (placeholderMismatch.length)
      console.error(`  placeholder mismatch (${placeholderMismatch.length}): ${placeholderMismatch.slice(0, 20).join(", ")}`);
  } else {
    console.log(`✓ ${locale} — ${cur.size} keys match`);
  }
}

console.log(`\nReference (${REFERENCE}): ${ref.size} keys across ${Object.keys(loadLocale(REFERENCE)).length} namespaces`);
if (failures) {
  console.error(`\n${failures} locale(s) out of sync.`);
  process.exit(1);
}
console.log("All locales in sync.");
