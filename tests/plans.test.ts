import { describe, it, expect } from "vitest";
import { formatLimit, isUnlimited, isWithinLimit, limitsFor, UNLIMITED } from "@accessaudit/shared";

describe("plan limits", () => {
  it("exposes the free tier caps", () => {
    const free = limitsFor("free");
    expect(free.clients).toBe(1);
    expect(free.projects).toBe(2);
    expect(free.whiteLabelPdf).toBe(false);
  });

  it("agency and scale have unlimited clients/projects", () => {
    expect(isUnlimited(limitsFor("agency").clients)).toBe(true);
    expect(isUnlimited(limitsFor("scale").projects)).toBe(true);
  });

  it("isWithinLimit gates the next item by current count", () => {
    // free allows 1 client: 0 -> ok, 1 -> blocked.
    expect(isWithinLimit("free", "clients", 0)).toBe(true);
    expect(isWithinLimit("free", "clients", 1)).toBe(false);
  });

  it("unlimited tiers never block", () => {
    expect(isWithinLimit("agency", "clients", 10_000)).toBe(true);
  });

  it("formatLimit renders Unlimited for infinite caps", () => {
    expect(formatLimit(UNLIMITED)).toBe("Unlimited");
    expect(formatLimit(25)).toBe("25");
  });
});
