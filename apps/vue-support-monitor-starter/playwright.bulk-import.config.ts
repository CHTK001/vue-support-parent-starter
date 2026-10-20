import { defineConfig } from "@playwright/test";

/**
 * BulkImportDialog 验收专用配置。
 *
 * <p>与 {@code playwright.repicker.config.ts} 同系列：同样连 8851 serve-dist，
 * 不托管 dev server（8851 由外部会话启动），不做 globalSetup（登录由用例自己处理）。</p>
 */
const BASE_URL = "http://127.0.0.1:8851";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["zz-bulk-import.spec.ts"],
  timeout: 300_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-bulk-report" }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    channel: "msedge",
    viewport: { width: 1500, height: 950 },
    locale: "zh-CN",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "msedge",
      use: { channel: "msedge", viewport: { width: 1500, height: 950 } },
    },
  ],
});
