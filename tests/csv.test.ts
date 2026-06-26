import { describe, it, expect } from "vitest";
import { escapeCsv, rowsToCsv } from "../apps/web/src/lib/csv";

describe("escapeCsv (formula-injection guard)", () => {
  it("always quotes and doubles embedded quotes", () => {
    expect(escapeCsv("plain")).toBe('"plain"');
    expect(escapeCsv('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("neutralizes cells that start with a formula trigger", () => {
    // =, +, -, @ are prefixed with an apostrophe so Excel/Sheets keeps them as text.
    expect(escapeCsv("=HYPERLINK(0)")).toBe("\"'=HYPERLINK(0)\"");
    expect(escapeCsv("+1+1")).toBe("\"'+1+1\"");
    expect(escapeCsv("-2")).toBe("\"'-2\"");
    expect(escapeCsv("@SUM(A1)")).toBe("\"'@SUM(A1)\"");
  });

  it("leaves a formula trigger that is not at the start alone", () => {
    expect(escapeCsv("a=b")).toBe('"a=b"');
  });
});

describe("rowsToCsv", () => {
  it("emits a UTF-8 BOM and CRLF rows", () => {
    const csv = rowsToCsv([
      ["Page", "Impact"],
      ["https://x.example/", "critical"],
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("\r\n");
    expect(csv).toContain('"https://x.example/"');
  });
});
