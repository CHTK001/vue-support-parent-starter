const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("pageerror", (e) => logs.push("[pageerror] " + e.message));
  page.on("console", (m) => { if (m.type() === "error") logs.push("[err] " + m.text()); });
  await page.goto("http://127.0.0.1:8848/#/project", { waitUntil: "load", timeout: 30000 }).catch(e => logs.push("[goto] " + e.message));
  await page.waitForTimeout(12000);
  console.log("URL:", page.url());
  console.log(".main count:", await page.locator(".main").count());
  console.log(".main exists in html:", await page.evaluate(() => document.querySelectorAll(".main").length));
  const main = page.locator(".main").first();
  console.log(".main first visible:", await main.isVisible().catch(() => false));
  if (await page.locator(".main").count() > 0) {
    console.log(".main text:", (await page.locator(".main").first().innerText()).slice(0, 200).replace(/\n+/g, " | "));
  }
  console.log("=== errors ===");
  logs.slice(0, 15).forEach(l => console.log(l));
  await page.screenshot({ path: "C:/Users/Administrator/AppData/Local/Temp/opencode/diag2.png" });
  await browser.close();
})();
