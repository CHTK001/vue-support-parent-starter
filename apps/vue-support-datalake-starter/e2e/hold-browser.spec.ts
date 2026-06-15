import { test } from "@playwright/test";

test("打开 Vue 前端并等待用户操作", async ({ page }) => {
  // 打开前端
  await page.goto("http://127.0.0.1:8853/");
  // 等待渲染完成
  await page.waitForSelector(".datalake-app", { timeout: 15000 });
  console.log("✅ 页面已打开，等待用户操作（60秒后自动退出）...");
  // 等待 60 秒，让 Playwright 保持浏览器窗口开着
  await page.waitForTimeout(60000);
});
