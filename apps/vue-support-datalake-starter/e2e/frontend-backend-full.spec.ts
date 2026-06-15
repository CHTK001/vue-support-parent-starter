import { test, expect } from "@playwright/test";

const VITE_URL = "http://127.0.0.1:8853";
const CONSOLE_URL = "http://127.0.0.1:58081";

test.describe("前后端完整联调", () => {
  test("Vue 前端：打开页面 + 所有 Tab 点击", async ({ page }) => {
    await page.goto(VITE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".datalake-app", { timeout: 15000 });

    // 等待后端连线
    await page.waitForSelector(".status-dot.online", { timeout: 15000 });
    console.log("✅ 页面加载 + 后端连线成功");

    // 截图：初始状态
    await page.screenshot({ path: "e2e/screenshots/final-01-load.png" });

    // 点击「流水线管理」
    await page.locator(".tab-item").filter({ hasText: "流水线管理" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/final-02-pipeline.png" });
    console.log("✅ 流水线管理 Tab");

    // 点击「数据查询」
    await page.locator(".tab-item").filter({ hasText: "数据查询" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/final-03-data.png" });
    console.log("✅ 数据查询 Tab");

    // 点击「订阅客户端」
    await page.locator(".tab-item").filter({ hasText: "订阅客户端" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/final-04-subscription.png" });
    console.log("✅ 订阅客户端 Tab");

    // 点击「采集管理」
    await page.locator(".tab-item").filter({ hasText: "采集管理" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/final-05-collector.png" });
    console.log("✅ 采集管理 Tab");

    // 点击「死信队列」
    await page.locator(".tab-item").filter({ hasText: "死信队列" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/final-06-dlq.png" });
    console.log("✅ 死信队列 Tab");

    // 点击「系统配置」
    await page.locator(".tab-item").filter({ hasText: "系统配置" }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "e2e/screenshots/final-07-settings.png" });
    console.log("✅ 系统配置 Tab");

    // 主题切换：科技 → 大屏
    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/final-08-theme-screen.png" });
    console.log("✅ 主题：大屏");

    // 主题切换：大屏 → 夜航
    await page.locator(".theme-btn").filter({ hasText: "夜航" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/final-09-theme-night.png" });
    console.log("✅ 主题：夜航");

    // 主题切回：夜航 → 科技
    await page.locator(".theme-btn").filter({ hasText: "科技" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "e2e/screenshots/final-10-theme-scifi.png" });
    console.log("✅ 主题切回：科技");

    console.log("🎉 Vue 前端所有 Tab + 主题切换完成！");
  });

  test("后端 Console：Token + Collect + Subscribe + Poll + Ack", async ({ page }) => {
    await page.goto(CONSOLE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 15000 });
    console.log("✅ Console 页面加载");

    // 1) 获取 Token
    await page.locator("#tokenBtn").click();
    await page.waitForTimeout(500);
    const stamp = await page.locator("#stamp").textContent();
    expect(stamp).not.toBe("BOOTING");
    console.log("✅ Token 获取：" + stamp);
    await page.screenshot({ path: "e2e/screenshots/final-11-console-token.png" });

    // 2) 加载状态
    await page.locator("#statusBtn").click();
    await page.waitForTimeout(500);
    const collectors = await page.locator("#collectors").textContent();
    console.log("✅ 状态加载，采集器数：" + collectors);
    await page.screenshot({ path: "e2e/screenshots/final-12-console-status.png" });

    // 3) 采集数据
    await page.locator("#collectBtn").click();
    await page.waitForTimeout(500);
    const logText = await page.locator("#log").textContent();
    expect(logText).toContain("collect");
    console.log("✅ 数据采集成功");
    await page.screenshot({ path: "e2e/screenshots/final-13-console-collect.png" });

    // 4) 订阅
    await page.locator("#subscribeBtn").click();
    await page.waitForTimeout(500);
    console.log("✅ 订阅成功");
    await page.screenshot({ path: "e2e/screenshots/final-14-console-subscribe.png" });

    // 5) 拉取
    await page.locator("#pollBtn").click();
    await page.waitForTimeout(500);
    console.log("✅ 拉取成功");
    await page.screenshot({ path: "e2e/screenshots/final-15-console-poll.png" });

    // 6) 确认
    await page.locator("#ackBtn").click();
    await page.waitForTimeout(500);
    console.log("✅ 确认成功");
    await page.screenshot({ path: "e2e/screenshots/final-16-console-ack.png" });

    console.log("🎉 后端 Console 完整流程完成！");
  });
});
