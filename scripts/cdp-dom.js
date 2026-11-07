/**
 * login DOM 探测 v1：看清楚 el-input 的结构。
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

  console.log("inner html of first login-input:");
  console.log(await page.$eval(".login-input", (el) => el.outerHTML));
  console.log("count .login-input:", await page.$$('.login-input').length);
  await browser.close();
})();
