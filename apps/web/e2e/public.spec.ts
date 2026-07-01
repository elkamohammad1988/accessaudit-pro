import { test, expect } from "@playwright/test";

/**
 * Unauthenticated surface: marketing, pricing, auth pages, i18n, security
 * headers, and error routes. These need no database and run anywhere the app is
 * served, so they are the always-on safety net for the public product.
 */

test.describe("public site", () => {
  test("home page renders with branded title", async ({ page }) => {
    await expect(page).toHaveTitle(/AccessAudit/i);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("pricing page shows every paid tier", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("Starter", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Agency", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Scale", { exact: false }).first()).toBeVisible();
  });

  test("login page exposes email + password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("response carries the hardened security headers", async ({ page }) => {
    const res = await page.goto("/");
    const headers = res?.headers() ?? {};
    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});

test.describe("internationalization", () => {
  test("locale cookie drives <html lang> (French)", async ({ context, page }) => {
    await context.addCookies([
      { name: "locale", value: "fr", url: "http://localhost:3000" },
    ]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("Arabic sets RTL direction", async ({ context, page }) => {
    await context.addCookies([
      { name: "locale", value: "ar", url: "http://localhost:3000" },
    ]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});

test.describe("error handling", () => {
  test("unknown route returns 404", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("public report with an invalid token 404s (no info leak)", async ({ page }) => {
    const res = await page.goto("/r/this-is-not-a-real-share-token");
    expect(res?.status()).toBe(404);
  });

  test("protected app route redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
