import { describe, it, expect } from "vitest";
import { safeNextPath } from "../apps/web/src/lib/utils";
import { normalizeScanUrl, isLikelyInternalHost } from "../apps/web/src/lib/url-safety";
import { isPrivateIp, isBlockedRequestUrl } from "../apps/worker/src/url-guard";

describe("safeNextPath (open-redirect guard)", () => {
  it("allows same-site absolute paths", () => {
    expect(safeNextPath("/clients")).toBe("/clients");
    expect(safeNextPath("/scans/abc?x=1")).toBe("/scans/abc?x=1");
  });

  it("rejects protocol-relative and absolute external URLs", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("evil.com")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});

describe("isPrivateIp (worker SSRF guard)", () => {
  it("flags loopback, private, link-local, CGNAT, metadata", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0"]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it("flags IPv6 loopback / ULA / link-local and IPv4-mapped", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fd00::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true);
  });

  it("flags IPv6 transition/embedding bypasses (NAT64, 6to4, hex-mapped, site-local, multicast)", () => {
    expect(isPrivateIp("::ffff:7f00:1")).toBe(true); // hex IPv4-mapped 127.0.0.1
    expect(isPrivateIp("64:ff9b::a00:1")).toBe(true); // NAT64-wrapped 10.0.0.1
    expect(isPrivateIp("64:ff9b::10.0.0.1")).toBe(true); // NAT64 dotted form
    expect(isPrivateIp("2002:7f00:1::")).toBe(true); // 6to4 prefix
    expect(isPrivateIp("fec0::1")).toBe(true); // deprecated site-local
    expect(isPrivateIp("ff02::1")).toBe(true); // multicast
  });

  it("allows public addresses", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });
});

describe("isBlockedRequestUrl (interceptor)", () => {
  it("blocks literal private IPs, localhost, and non-http schemes", () => {
    expect(isBlockedRequestUrl("http://127.0.0.1/")).toBe(true);
    expect(isBlockedRequestUrl("http://169.254.169.254/latest/meta-data/")).toBe(true);
    expect(isBlockedRequestUrl("http://localhost/")).toBe(true);
    expect(isBlockedRequestUrl("file:///etc/passwd")).toBe(true);
  });

  it("allows public http(s) hosts", () => {
    expect(isBlockedRequestUrl("https://example.com/")).toBe(false);
  });
});

describe("normalizeScanUrl (web early gate)", () => {
  it("normalizes scheme-less input to https", () => {
    expect(normalizeScanUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects internal / private targets", () => {
    expect(normalizeScanUrl("http://127.0.0.1")).toBeNull();
    expect(normalizeScanUrl("http://192.168.0.1")).toBeNull();
    expect(normalizeScanUrl("localhost")).toBeNull();
    expect(normalizeScanUrl("http://internal.local")).toBeNull();
    expect(normalizeScanUrl("ftp://example.com")).toBeNull();
  });

  it("flags internal hosts directly", () => {
    expect(isLikelyInternalHost("169.254.169.254")).toBe(true);
    expect(isLikelyInternalHost("example.com")).toBe(false);
  });
});
