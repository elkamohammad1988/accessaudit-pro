import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DNS so we can simulate a hostname that rebinds to a private address.
const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: lookupMock }));

import { isRequestUrlBlocked, assertScannableUrl } from "../apps/worker/src/url-guard";

const PRIVATE = [{ address: "10.0.0.5", family: 4 }];
const METADATA = [{ address: "169.254.169.254", family: 4 }];
const PUBLIC = [{ address: "93.184.216.34", family: 4 }];

beforeEach(() => {
  lookupMock.mockReset();
});

describe("isRequestUrlBlocked (interceptor, DNS-rebinding closed)", () => {
  it("blocks literal private IPs synchronously without a DNS lookup", async () => {
    expect(await isRequestUrlBlocked("http://127.0.0.1/")).toBe(true);
    expect(await isRequestUrlBlocked("http://169.254.169.254/latest/meta-data/")).toBe(true);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it("blocks a HOSTNAME that resolves to a private address (the rebinding fix)", async () => {
    lookupMock.mockResolvedValue(PRIVATE);
    expect(await isRequestUrlBlocked("https://rebind.evil.example/")).toBe(true);
  });

  it("blocks a hostname that resolves to cloud metadata", async () => {
    lookupMock.mockResolvedValue(METADATA);
    expect(await isRequestUrlBlocked("https://metadata-rebind.example/")).toBe(true);
  });

  it("allows a hostname that resolves to a public address", async () => {
    lookupMock.mockResolvedValue(PUBLIC);
    expect(await isRequestUrlBlocked("https://example.com/")).toBe(false);
  });

  it("fails closed when resolution throws", async () => {
    lookupMock.mockRejectedValue(new Error("ENOTFOUND"));
    expect(await isRequestUrlBlocked("https://broken.example/")).toBe(true);
  });

  it("caches resolution per host", async () => {
    lookupMock.mockResolvedValue(PUBLIC);
    const cache = new Map<string, boolean>();
    await isRequestUrlBlocked("https://example.com/a", cache);
    await isRequestUrlBlocked("https://example.com/b", cache);
    expect(lookupMock).toHaveBeenCalledTimes(1);
  });
});

describe("assertScannableUrl", () => {
  it("throws when a hostname resolves to any private address", async () => {
    lookupMock.mockResolvedValue([...PUBLIC, ...PRIVATE]);
    await expect(assertScannableUrl("https://mixed.example/")).rejects.toThrow(/private address/);
  });

  it("resolves for a public host", async () => {
    lookupMock.mockResolvedValue(PUBLIC);
    await expect(assertScannableUrl("https://example.com/")).resolves.toBeUndefined();
  });

  it("rejects non-http(s) schemes before any lookup", async () => {
    await expect(assertScannableUrl("ftp://example.com/")).rejects.toThrow(/protocol/i);
    expect(lookupMock).not.toHaveBeenCalled();
  });
});
