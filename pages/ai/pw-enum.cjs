const { chromium } = require("@playwright/test");
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:5173/#/nomi", { waitUntil: "networkidle", timeout: 40000 });
  await p.waitForTimeout(8000);
  // 先保证有伙伴（如果 beforeAll 清理了，这里页面是空态则无法测 tab）——探针不准备数据，只看当前

  const tabs = ["总览", "记忆", "技能", "聊天历史", "其他"];
  const result = {};
  for (const tab of tabs) {
    const tabEl = p.locator(`[role="tab"]:has-text("${tab}")`).first();
    if (await tabEl.count()) { await tabEl.click().catch(() => {}); }
    await p.waitForTimeout(1500);
    // 收集该 tab 视图下所有 button 及 clickable 文本（去重、去噪）
    const all = await p.evaluate(() => {
      const els = [...document.querySelectorAll("button, [role='button'], [role='tab'], [data-testid]")];
      const seen = new Set();
      const out = [];
      for (const el of els) {
        const txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
        const cls = (el.className || "").slice(0, 40);
        const key = txt + "|" + cls;
        if (seen.has(key)) continue;
        seen.add(key);
        if (txt || cls) out.push({ txt, cls });
      }
      return out;
    }).catch(() => []);
    result[tab] = all.filter((x) => x.txt && !x.txt.includes("nomi-mochi") && !x.txt.includes("CSS") && !x.txt.includes("transform-box"));
  }
  console.log(JSON.stringify(result, null, 1));
  await b.close();
})();