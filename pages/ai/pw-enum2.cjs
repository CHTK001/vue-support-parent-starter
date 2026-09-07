const { chromium } = require("@playwright/test");
const BACK = "http://127.0.0.1:8787";
async function api(path, opts) {
  const res = await fetch(BACK + path, { headers: { "content-type": "application/json" }, ...opts });
  return res.json();
}
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:5173/#/nomi", { waitUntil: "networkidle", timeout: 40000 });
  await p.waitForTimeout(8000);

  const result = {};
  const collect = async (label, tabText) => {
    if (tabText) {
      const tabEl = p.locator(`[role="tab"]:has-text("${tabText}")`).first();
      if (await tabEl.count()) { await tabEl.click().catch(() => {}); }
      await p.waitForTimeout(1800);
    }
    const btns = await p.evaluate(() => {
      const seen = new Set(); const out = [];
      for (const el of document.querySelectorAll("button, [role='button']")) {
        const txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50);
        if (!txt || seen.has(txt) || txt.includes("nomi-mochi") || txt.includes("transform-box") || txt.includes("ground shadow") || txt.length > 40) continue;
        seen.add(txt); out.push(txt);
      }
      return out;
    }).catch(() => []);
    result[label] = btns;
  };

  await collect("进化", "进化");
  await collect("其他full", "其他");
  // 形象库页
  const fig = p.locator("text=形象库").first().or(p.locator("text=Figures").first());
  if (await fig.count()) { await fig.click().catch(() => {}); await p.waitForTimeout(1800); }
  await collect("形象库页");
  // 打开聊天页按钮
  const chat = p.locator("text=打开聊天").first();
  const goChat = async () => {
    const t = p.locator("[role=tab]:has-text('总览')").first();
    if (await t.count()) await t.click().catch(()=>{});
    await p.waitForTimeout(800);
    const ch = p.locator("text=打开聊天").first();
    if (await ch.count()) { await ch.click().catch(() => {}); }
    await p.waitForTimeout(2500);
  };
  await goChat().catch(() => {});
  const onConv = p.url().includes("#/conversation/");
  if (onConv) {
    const btns = await p.evaluate(() => {
      const seen = new Set(); const out = [];
      for (const el of document.querySelectorAll("button, [role='button']")) {
        const txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50);
        if (!txt || seen.has(txt) || txt.includes("nomi-mochi") || txt.includes("transform-box") || txt.length > 40) continue;
        seen.add(txt); out.push(txt);
      }
      return out;
    }).catch(() => []);
    result["聊天页"] = btns;
  } else {
    result["聊天页"] = ["(未跳转)"];
  }

  console.log(JSON.stringify(result, null, 1));
  await b.close();
})();