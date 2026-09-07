const { chromium } = require("@playwright/test");
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:5173/#/nomi", { waitUntil: "networkidle", timeout: 40000 });
  await p.waitForTimeout(8000);
  const mem = p.locator('[role="tab"]:has-text("记忆")').first();
  if (await mem.count()) { await mem.click(); }
  await p.waitForTimeout(2000);
  const body = await p.locator("body").innerText().catch(() => "");
  console.log("LEN", body.length);
  console.log(JSON.stringify(body.slice(-900)));
  await b.close();
})();