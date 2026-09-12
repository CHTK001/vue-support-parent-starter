const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on("pageerror", (e) => logs.push("[pageerror] " + e.message));
  page.on("console", (m) => logs.push("[" + m.type() + "] " + m.text()));
  page.on("requestfailed", (r) => logs.push("[reqfail] " + r.url() + " " + (r.failure()?.errorText || "")));

  await page.goto("http://127.0.0.1:8848/#/project", { waitUntil: "load", timeout: 30000 }).catch(e => logs.push("[goto] " + e.message));
  await page.waitForTimeout(8000);

  console.log("URL:", page.url());
  console.log("body:", (await page.evaluate(() => document.body.innerText)).slice(0, 400).replace(/\n+/g, " | "));
  console.log("=== ALL logs (" + logs.length + ") ===");
  logs.forEach(l => console.log(l));
  await browser.close();
})();
