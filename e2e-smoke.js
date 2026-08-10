const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, viewport: { width: 1920, height: 1080 } });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 200)));

  await page.goto("http://127.0.0.1:5173/login", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(30000);
  const c = await page.locator("input").count();
  console.log("Input count:", c);

  if (c >= 2) {
    await page.locator("input").nth(0).fill("admin");
    await page.locator("input").nth(1).fill("wrongpwd123");
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "登录" }).click();
    await page.waitForTimeout(3000);
    const toast = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.el-message')).map(el => el.textContent.trim()).join(" | ");
    });
    console.log("Toast:", toast || "(empty)");
  }

  await browser.close();
  process.exit(0);
})().catch(e => { console.error("FATAL:", e.stack); process.exit(1); });