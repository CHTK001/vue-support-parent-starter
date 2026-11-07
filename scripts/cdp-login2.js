/**
 * 登录流程验证 v2：用 CDP mouse（Playwright mouse）拖滑块，用 click 模拟 el-input 输入。
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
  console.log("slider present:", await page.isVisible(".slider-verify-track"));

  const track = await page.$(".slider-verify-track");
  const rect = await track.boundingBox();
  console.log("track rect:", JSON.stringify(rect));

  // CDP mouse drag
  await page.mouse.move(rect.x + 30, rect.y + rect.height / 2);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 50));
  for (let i = 0; i < 30; i++) {
    const x = rect.x + 30 + (rect.width * 0.9 - 30) * (i / 30);
    await page.mouse.move(x, rect.y + rect.height / 2);
    await new Promise((r) => setTimeout(r, 20));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));
  console.log("drag class =", await page.$eval(".slider-verify", (el) => el.className));

  // 漏斗：el-input 是 div，往 wrapper 里 shift+insert 模拟文本
  await page.locator(".login-input").first().click();
  await page.keyboard.press("a", { delay: 50 });
  await page.keyboard.type("admin", { delay: 30 });
  await page.locator(".login-input").nth(1).click();
  await page.keyboard.type("admin123", { delay: 30 });
  console.log("inputs:", await page.$eval(".login-input", (els) => Array.from(els).map(el => el.textContent)));

  await page.click(".login-btn");
  await new Promise((r) => setTimeout(r, 2000));
  console.log("after login url:", page.url());
  console.log("form class:", await page.$eval(".login-form", (el) => el.className).catch(e => "n/a"));

  await browser.close();
})();
