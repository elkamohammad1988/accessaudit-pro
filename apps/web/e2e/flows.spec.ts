import { test, expect } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "./global-setup";

/**
 * Authenticated product flow: sign in → onboarding → client → project → scan →
 * report state → billing. Requires a seeded Supabase (see global-setup.ts); the
 * whole file skips when the service-role key is absent so the public suite still
 * runs in environments without a database.
 *
 * The free-tier user (no subscription) is within quota for exactly one client and
 * one project, so the flow stays inside plan limits and is repeatable thanks to
 * the clean-slate seed.
 */
test.skip(!process.env.SUPABASE_SERVICE_ROLE_KEY, "needs a provisioned Supabase");

// Run the steps in order against one shared session.
test.describe.configure({ mode: "serial" });

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(E2E_EMAIL);
  await page.locator('input[type="password"]').fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  // New user with no workspace lands on onboarding.
  await page.waitForURL(/\/(onboarding|dashboard)/);
}

test("a new user is routed through onboarding to a working dashboard", async ({ page }) => {
  await signIn(page);
  if (new URL(page.url()).pathname.startsWith("/onboarding")) {
    await page.getByRole("textbox").first().fill("E2E Test Agency");
    await page.getByRole("button", { name: /create|continue|get started/i }).click();
  }
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("create a client, then a project under it", async ({ page }) => {
  await signIn(page);
  await page.waitForURL(/\/dashboard/);

  // Client
  await page.goto("/clients/new");
  await page.getByLabel(/name/i).first().fill("Acme Co");
  await page.getByRole("button", { name: /save|create|add/i }).click();
  await page.waitForURL(/\/clients\//);
  await expect(page.getByText("Acme Co").first()).toBeVisible();

  // Project (depends on the client existing)
  await page.goto("/projects/new");
  await page.getByLabel(/name/i).first().fill("Acme Website");
  // base URL field
  await page.locator('input[inputmode="url"], input[name="baseUrl"]').first().fill("https://example.com");
  await page.getByRole("button", { name: /save|create|add/i }).click();
  await page.waitForURL(/\/projects\//);
  await expect(page.getByText("Acme Website").first()).toBeVisible();
});

test("start a scan and reach the report page in a valid state", async ({ page }) => {
  await signIn(page);
  await page.goto("/scans/new");
  // A project should already exist from the previous step; the URL defaults to it.
  await page.getByRole("button", { name: /scan|start|run/i }).first().click();
  await page.waitForURL(/\/scans\//);
  // Without asserting the worker finished, the report must render one of the known
  // lifecycle states (queued/running/completed/partial/failed) — never a crash.
  await expect(
    page.getByText(/queued|running|completed|partial|failed|in progress/i).first(),
  ).toBeVisible();
});

test("billing page shows the free plan and upgrade options", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings/billing");
  await expect(page.getByText(/free/i).first()).toBeVisible();
  await expect(page.getByText(/agency/i).first()).toBeVisible();
});
