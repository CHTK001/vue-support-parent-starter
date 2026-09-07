/**
 * 美化验收专用 Playwright 配置 —— 独立于既有 playwright.config.ts（其 baseURL 5173 与实际端口不符）
 * 运行：npx playwright test --config playwright.beautify.config.ts
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /beautify-full-features\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/beautify-html" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    headless: true,
    viewport: { width: 1600, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: "test-results/beautify-artifacts",
});
