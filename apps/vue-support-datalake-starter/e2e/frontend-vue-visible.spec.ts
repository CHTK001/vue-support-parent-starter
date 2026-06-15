import { test, expect } from "@playwright/test";

const VITE_URL = "http://127.0.0.1:8853";

test.describe("Vue 前端可视化联调", () => {
  test("完整 Tab 导航 + 点击交互", async ({ page }) => {
    // 打开页面，等待渲染
    await page.goto(VITE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".datalake-app", { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-01-load.png" });

    // 验证标题
    await expect(page.locator(".brand-text h1")).toHaveText("数据中台");
    console.log("✅ 页面加载成功");

    // 点击"流水线管理" Tab
    await page.locator(".tab-item").filter({ hasText: "流水线管理" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-02-pipeline.png" });
    console.log("✅ 流水线管理 Tab 点击成功");

    // 点击"数据查询" Tab
    await page.locator(".tab-item").filter({ hasText: "数据查询" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-03-data.png" });
    console.log("✅ 数据查询 Tab 点击成功");

    // 点击"订阅客户端" Tab
    await page.locator(".tab-item").filter({ hasText: "订阅客户端" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-04-subscription.png" });
    console.log("✅ 订阅客户端 Tab 点击成功");

    // 点击"采集管理" Tab
    await page.locator(".tab-item").filter({ hasText: "采集管理" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-05-collector.png" });
    console.log("✅ 采集管理 Tab 点击成功");

    // 点击"死信队列" Tab
    await page.locator(".tab-item").filter({ hasText: "死信队列" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-06-dlq.png" });
    console.log("✅ 死信队列 Tab 点击成功");

    // 点击"系统配置" Tab
    await page.locator(".tab-item").filter({ hasText: "系统配置" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-07-settings.png" });
    console.log("✅ 系统配置 Tab 点击成功");

    // 切回"监控大屏" Tab
    await page.locator(".tab-item").filter({ hasText: "监控大屏" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-08-monitor.png" });
    console.log("✅ 监控大屏 Tab 切回成功");

    // 主题切换：科技 → 大屏
    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-09-theme-screen.png" });
    console.log("✅ 主题切换：科技 → 大屏");

    // 主题切换：大屏 → 夜航
    await page.locator(".theme-btn").filter({ hasText: "夜航" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-10-theme-night.png" });
    console.log("✅ 主题切换：大屏 → 夜航");

    // 主题切换：夜航 → 科技
    await page.locator(".theme-btn").filter({ hasText: "科技" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-11-theme-scifi.png" });
    console.log("✅ 主题切换：夜航 → 科技");

    // 点击刷新按钮
    await page.locator(".header-refresh-btn").click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/vue-visible-12-refresh.png" });
    console.log("✅ 刷新按钮点击成功");

    console.log("🎉 所有 Tab 导航和主题切换测试完成！");
  });
});
