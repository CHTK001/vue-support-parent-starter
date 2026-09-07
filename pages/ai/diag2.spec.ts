import { test } from "@playwright/test";

const FRONT = "http://127.0.0.1:5173";

test.describe("diag2", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("复刻探针：networkidle + 长等待", async ({ page }) => {
    await page.goto(`${FRONT}/#/nomi`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(8000);
    console.log("URL:", page.url());
    console.log("title:", await page.title());
    const body = await page.locator("body").innerText().catch(() => "[err]");
    console.log("BODY[0:180]:", JSON.stringify(body.slice(0, 180)));
    console.log("newBtn:", await page.locator("text=新建伙伴").count());
    console.log("xiaolan:", await page.locator("text=小蓝").count());
    console.log("openChat:", await page.locator("text=打开聊天").count());
    console.log("tab总览:", await page.locator("text=总览").count());
  });
});