import { test, expect } from "@playwright/test";

const VITE_URL = "http://127.0.0.1:8853";

test.describe("Vue Frontend E2E", () => {
  test("页面加载和 Tab 导航", async ({ page }) => {
    await page.goto(VITE_URL, { waitUntil: "networkidle" });

    await page.waitForSelector(".datalake-app", { timeout: 15000 });

    await expect(page.locator(".brand-text h1")).toHaveText("数据中台");

    await expect(page.locator(".status-dot")).toBeVisible();

    await page.screenshot({ path: "e2e/screenshots/vue-01-load.png" });
  });

  test("Tab 切换 - 流水线管理", async ({ page }) => {
    await page.goto(VITE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".status-dot.online", { timeout: 15000 });

    await page.locator(".tab-item").filter({ hasText: "流水线管理" }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/vue-02-pipeline.png" });
  });

  test("Tab 切换 - 数据查询", async ({ page }) => {
    await page.goto(VITE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".status-dot.online", { timeout: 15000 });

    await page.locator(".tab-item").filter({ hasText: "数据查询" }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/vue-03-data.png" });
  });

  test("主题切换", async ({ page }) => {
    await page.goto(VITE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".status-dot.online", { timeout: 15000 });

    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/vue-04-theme-screen.png" });
  });
});
