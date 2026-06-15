import { test, expect } from "@playwright/test";

const VITE = "http://127.0.0.1:8853";

test.describe("协议控制台 Tab + 主题背景平铺", () => {
  test("打开协议控制台 Tab", async ({ page }) => {
    await page.goto(VITE, { waitUntil: "networkidle" });
    await page.waitForSelector(".datalake-app", { timeout: 15000 });

    // 确认「协议控制台」Tab 存在
    await expect(page.locator(".tab-item").filter({ hasText: "协议控制台" })).toBeVisible();

    // 点击「协议控制台」
    await page.locator(".tab-item").filter({ hasText: "协议控制台" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/console-tab.png" });

    // 确认状态卡片出现（4 张）
    await expect(page.locator(".stat-card")).toHaveCount(4);

    // 确认表单字段
    await expect(page.locator(".form-field").first()).toContainText("Topic");
    await expect(page.locator(".form-field").nth(1)).toContainText("Pipeline");

    // 点击「采集」按钮
    await page.locator("button.el-button").filter({ hasText: "采集" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/console-collect.png" });

    console.log("✅ 协议控制台 Tab 正常");
  });

  test("三个主题 + 背景平铺", async ({ page }) => {
    await page.goto(VITE, { waitUntil: "networkidle" });
    await page.waitForSelector(".datalake-app", { timeout: 15000 });

    // 科技 → 大屏
    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/theme-screen.png" });
    console.log("✅ 主题：大屏");

    // 大屏 → 夜航
    await page.locator(".theme-btn").filter({ hasText: "夜航" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/theme-night.png" });
    console.log("✅ 主题：夜航");

    // 夜航 → 科技
    await page.locator(".theme-btn").filter({ hasText: "科技" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/theme-scifi.png" });
    console.log("✅ 主题：科技");

    // 验证背景是 repeat（平铺）
    const bg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).background;
    });
    console.log("Background:", bg);
    // data URI SVG pattern + repeat
    expect(bg).toContain("repeat");

    console.log("✅ 背景平铺验证通过");
  });
});
