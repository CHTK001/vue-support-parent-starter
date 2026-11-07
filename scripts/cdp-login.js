const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
let page;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--no-sandbox"] });
  const ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await new Promise((r) => setTimeout(r, 3000));
  const html = await page.evaluate(() => {
    const form = document.querySelector(".login-form");
    return form ? form.outerHTML.slice(0, 3000) : "no .login-form";
  });
  console.log("login-form:", html);
  const f = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("*")).map((e) => `${e.tagName}.${e.className}`).filter((c) => c.length && (c.includes("slider") || c.includes("login") || c.includes("screen")));
  });
  console.log("matched:", JSON.stringify(f.slice(0, 40), null, 1));
  await browser.close();
})();
