const { test: _t, chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:5173/#/nomi", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(5000);
  const body = await page.locator("body").innerText().catch(() => "");
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());
  console.log("BODY_HEAD:", JSON.stringify(body.slice(0, 300)));
  await browser.close();
})();
