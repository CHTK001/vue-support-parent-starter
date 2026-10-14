import { defineConfig } from "@playwright/test";

/**
 * ReFilePicker 验收专用配置。
 *
 * <p>与 {@code playwright.config.ts} 的区别：不托管 dev server，只复用
 * 已在 8848 由其他会话启动的 monitor 前端。若 8848 不在监听，套件直接报
 * 连接错误，而不会擅自拉起服务。</p>
 */
const BASE_URL = process.env.MS_E2E_BASE_URL ?? "http://127.0.0.1:8848";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["zz-re-file-picker.spec.ts"],
  timeout: 300_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-repicker-report" }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    channel: "msedge",
    viewport: { width: 1500, height: 950 },
    locale: "zh-CN",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "msedge",
      use: { channel: "msedge", viewport: { width: 1500, height: 950 } },
    },
  ],
});
