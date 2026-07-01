import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Two tiers of tests live under ./e2e:
 *   - public.spec.ts   — unauthenticated routes (marketing, pricing, auth pages,
 *                        i18n, security headers, 404s). Runs anywhere the web app
 *                        is served; needs no database.
 *   - flows.spec.ts    — authenticated product flows (onboarding → client →
 *                        project → scan → report → billing). Requires a seeded
 *                        Supabase (see global-setup.ts) and is gated on
 *                        E2E_SUPABASE_READY so it self-skips when the stack isn't up.
 *
 * In CI the `e2e` job provisions Supabase via the CLI, seeds a confirmed user,
 * builds the app, and runs both tiers (see .github/workflows/ci.yml).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Each spec file runs serially within itself; files parallelize.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Global setup seeds a confirmed test user when the Supabase service-role key is
  // present; otherwise it leaves E2E_SUPABASE_READY unset and the authed specs skip.
  globalSetup: "./e2e/global-setup.ts",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Start the production server for the run unless one is already up (local dev).
  webServer: {
    command: "pnpm start",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
