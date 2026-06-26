/*
 * Loads the monorepo-root env file(s) into process.env BEFORE env.ts / sentry.ts
 * read them. Must be the first import in index.ts.
 *
 * The worker runs via `tsx`, which (unlike Next.js for the web app) does not load
 * any `.env` file on its own — so without this the worker sees an empty env and
 * `required("SUPABASE_URL")` throws. Self-contained (no cross-package import) so it
 * stays inside the worker's tsconfig `include`. Mirrors scripts/load-env.mjs.
 *
 * Precedence (highest first):  real process.env (shell / CI)  >  .env.local  >  .env
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// apps/worker/src -> repo root
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Minimal dotenv parser: KEY=VALUE, `export ` prefix, `#` comments, quoted values. */
function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const body = line.startsWith("export ") ? line.slice(7) : line;
    const eq = body.indexOf("=");
    if (eq === -1) continue;
    const key = body.slice(0, eq).trim();
    if (!key) continue;
    let value = body.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) {
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    }
    out[key] = value;
  }
  return out;
}

function loadFile(name: string): void {
  let content: string;
  try {
    content = readFileSync(resolve(ROOT, name), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return; // file is optional
    throw err;
  }
  for (const [key, value] of Object.entries(parseEnv(content))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// `.env.local` first so it wins over `.env` (we never overwrite an already-set key).
loadFile(".env.local");
loadFile(".env");
