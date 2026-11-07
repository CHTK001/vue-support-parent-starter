/**
 * 登录流程验证 v4：CDP mouse 拖滑块 + 绑定 .el-input__inner 输入。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
let page;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--no-sandbox"] });
  const ctx = await browser.newContext();
  page = await ctx.newPage();

  await page.goto(TARGET, { waitUntil: "networkidle" });
  await new Promise((r) => setTimeout(r, 3000));

  await page.waitForSelector(".login-form", { timeout: 10000 });

  const track = await page.$(".slider-verify-track");
  const rect = await track.boundingBox();
  console.log("track rect:", JSON.stringify(rect));

  // CDP mouse drag
  await page.mouse.move(rect.x + 30, rect.y + rect.height / 2);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 80));
  for (let i = 0; i < 30; i++) {
    const x = rect.x + 30 + (rect.width * 0.9 - 30) * (i / 30);
    await page.mouse.move(x, rect.y + rect.height / 2);
    await new Promise((r) => setTimeout(r, 20));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 600));
  console.log("drag class =", (await page.$eval(".slider-verify", (el) => el.className)).trim());

  // fill inputs via native inner input
  const inputs = page.locator(".login-input .el-input__inner");
  await inputs.first().click();
  await inputs.first().press("ControlKey+a");
  await inputs.first().press("Backspace");
  await inputs.first().type("admin", { delay: 30 });
  await inputs.nth(1).click();
  await inputs.nth(1).press("ControlKey+a");
  await inputs.nth(1).press("Backspace");
  await inputs.nth(1).type("admin123", { delay: 30 });
  console.log("values:", await page.$eval(".login-input", (els) => Array.from(els).map(el => el.querySelector('.el-input__inner')?.value)));

  await page.click(".login-btn");
  await new Promise((r) => setTimeout(r, 2000));
  console.log("after login url:", page.url());

  await browser.close();
})();
