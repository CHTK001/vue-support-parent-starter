const { chromium } = require("@playwright/test");
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:5173/#/nomi", { waitUntil: "networkidle", timeout: 40000 });
  await p.waitForTimeout(8000);
  // 记忆 tab
  const mem = p.locator('[role="tab"]:has-text("记忆")').first();
  if (await mem.count()) { await mem.click(); }
  await p.waitForTimeout(2000);
  // 找所有按钮文本
  const btns = await p.locator("button, [role=button], [role=tab]").allTextContents().catch(() => []);
  const clean = btns.map((t) => t.trim()).filter((t) => t && !t.includes("CSS") && !t.includes("nomi-mochi") && t.length < 40);
  console.log("BUTTONS:", JSON.stringify([...new Set(clean)].slice(0, 40)));
  await b.close();
})();