const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 500)));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 800)));
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle", timeout: 20000 }).catch((e) => console.log("[goto]", e.message));
  await page.waitForTimeout(4000);
  console.log("URL:", page.url());
  console.log("BODY:", JSON.stringify((await page.evaluate(() => document.body.innerText.slice(0, 300)))));
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
