import { test } from "@playwright/test";

const FRONT = "http://127.0.0.1:5173";

test.describe("diag2", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("复刻探针：networkidle + 长等待", async ({ page }) => {
    await page.goto(`${FRONT}/#/nomi`, { waitUntil: "networkidle", timeout: 40000 });
    await page.waitForTimeout(8000);
    console.log("URL:", page.url());
    console.log("title:", await page.title());
    const body = await page.locator("body").innerText().catch(() => "[err]");
    console.log("BODY_LEN:", body.length);
    console.log("BODY_TAIL:", JSON.stringify(body.slice(-300)));
    console.log("spinner:", await page.locator("[class*=spin], [class*=Loading], [class*=loading]").count());
    console.log("mochi:", await page.locator(".nomi-mochi, [class*=nomi]").count());
    console.log("tabs:", await page.locator('[role="tab"]').allTextContents().then(a=>a.slice(-8)));
    console.log("hasNewCompanion:", await page.locator("text=New companion").count());
    console.log("hasOpenChat:", await page.locator("text=Open chat").count(), await page.locator("text=Open Chat").count());
    console.log("hasMemory:", await page.locator("text=Memory").count());
    console.log("hasSkill:", await page.locator("text=Skills").count());
    console.log("hasOverview:", await page.locator("text=Overview").count());
  });
});