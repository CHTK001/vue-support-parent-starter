const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ channel: "msedge" });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://127.0.0.1:8848/#/config", { waitUntil: "load" });
  await p.waitForTimeout(3000);
  await p.locator('button:has-text("新增策略")').first().click();
  await p.waitForTimeout(1200);
  const dlg = p.locator(".el-dialog");
  console.log("dialog count:", await dlg.count(), "visible:", await dlg.first().isVisible().catch(() => false));
  const btns = p.locator(".el-dialog button");
  for (const btn of await btns.all()) {
    const t = (await btn.innerText().catch(() => "")).trim();
    const cls = (await btn.getAttribute("class")) || "";
    console.log("  dlg-btn:", JSON.stringify(t), "|", cls.slice(0, 50));
  }
  console.log("dlg inputs:", await p.locator(".el-dialog input").count());
  await b.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
