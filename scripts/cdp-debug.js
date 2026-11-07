const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
let page;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--no-sandbox"] });
  const ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(TARGET, { waitUntil: "networkidle" });
  const t0 = Date.now();
  const form = await page.waitForSelector(".login-form", { timeout: 15000 });
  console.log("login-form after", Date.now() - t0, "ms");
  const t1 = Date.now();
  const track = await page.waitForSelector(".slider-verify-track", { timeout: 15000 });
  console.log("slider-track after", Date.now() - t1, "ms");
  const r2 = await track.boundingBox();
  console.log("track rect:", JSON.stringify(r2));
  await browser.close();
})();
