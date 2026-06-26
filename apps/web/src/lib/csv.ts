const FORMULA_PREFIXES = new Set(["=", "+", "-", "@"]);

/**
 * Quote a CSV cell and neutralize spreadsheet formula injection. A cell beginning
 * with =, +, -, @ (or a tab/CR) is evaluated by Excel/Sheets — and our cells carry
 * attacker-influenced content (scanned-page HTML, failure summaries, URLs). Prefix
 * such cells with an apostrophe so they're always treated as text.
 */
export function escapeCsv(value: string): string {
  const code = value.charCodeAt(0);
  const dangerous = FORMULA_PREFIXES.has(value[0]) || code === 0x09 || code === 0x0d;
  const safe = dangerous ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Serialize rows to a CSV string with a UTF-8 BOM (Excel) and CRLF line endings. */
export function rowsToCsv(rows: string[][]): string {
  return "﻿" + rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(",")).join("\r\n");
}
