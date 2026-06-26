/*
 * Zero-dependency loader for the monorepo-root env file(s).
 *
 * Why this exists: Turborepo runs each app from its OWN package dir, and neither
 * Next.js nor the tsx worker reads a *parent*-directory `.env` automatically — so
 * a single root `.env.local` would silently not load (this is exactly why the
 * worker crashed with "Missing required env var SUPABASE_URL"). This module loads
 * the root file(s) explicitly. It is imported by `apps/web/next.config.mjs`, and
 * mirrored (self-contained, to satisfy the worker's tsconfig) by
 * `apps/worker/src/load-env.ts`.
 *
 * Precedence (highest first):  real process.env (shell / CI)  >  .env.local  >  .env
 * — an already-set variable is never overwritten, and `.env.local` wins over `.env`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// scripts/ -> repo root
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal dotenv parser: KEY=VALUE, `export ` prefix, `#` comments, quoted values. */
function parseEnv(content) {
  const out = {};
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

function loadFile(name) {
  let content;
  try {
    content = readFileSync(resolve(ROOT, name), "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") return; // file is optional
    throw err;
  }
  for (const [key, value] of Object.entries(parseEnv(content))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// `.env.local` first so it wins over `.env` (we never overwrite an already-set key).
loadFile(".env.local");
loadFile(".env");
