const { chromium } = require("@playwright/test");

const BACK = "http://127.0.0.1:8787";

async function api(path, opts) {
  const res = await fetch(BACK + path, { headers: { "content-type": "application/json" }, ...opts });
  return res.json();
}

(async () => {
  // 准备数据：清理旧伙伴，建「枚举测试伙伴」
  const list = await api("/api/companion/companions");
  const others = (list.data || []).filter((c) => c.name !== "枚举测试伙伴");
  for (const c of others) await fetch(BACK + "/api/companion/companions/" + c.companion_id, { method: "DELETE" }).catch(() => {});
  let cid = (list.data || []).find((c) => c.name === "枚举测试伙伴")?.companion_id;
  if (!cid) {
    const created = await api("/api/companion/companions", { method: "POST", body: JSON.stringify({ name: "枚举测试伙伴", character: "mochi" }) });
    cid = created.data.companion_id;
  }
  await api("/api/companion/companions/" + cid, { method: "PATCH", body: JSON.stringify({ model: { provider_id: "01a04372-475b-7687-8005-94549abc562d", model: "agnes-2.5-flash" } }) });
  await api("/api/companion/memories", { method: "POST", body: JSON.stringify({ kind: "preference", content: "枚举独特记忆A", companion_id: cid }) });
  await api("/api/companion/memories", { method: "POST", body: JSON.stringify({ kind: "preference", content: "枚举独特记忆，A。", companion_id: cid }) });
  await api("/api/companion/companions/" + cid + "/skills", { method: "POST", body: JSON.stringify({ skill_name: "枚举技能", description: "d", content: "# x" }) });
  console.log("cid:", cid);

  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:5173/#/nomi", { waitUntil: "networkidle", timeout: 40000 });
  await p.waitForTimeout(8000);

  const tabs = ["总览", "记忆&知识库", "技能", "聊天历史", "其他"];
  const result = { tabs: [] };
  for (const tab of tabs) {
    const tabEl = p.locator(`[role="tab"]:has-text("${tab}")`).first();
    if (await tabEl.count()) { await tabEl.click().catch(() => {}); }
    await p.waitForTimeout(1800);
    const btns = await p.evaluate(() => {
      const seen = new Set();
      const out = [];
      for (const el of document.querySelectorAll("button, [role='button']")) {
        const txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50);
        const key = txt;
        if (!txt || seen.has(key) || txt.includes("nomi-mochi") || txt.includes("transform-box") || txt.includes("ground shadow") || txt.length > 40) continue;
        seen.add(key);
        out.push(txt);
      }
      return out;
    }).catch(() => []);
    result.tabs.push({ tab, buttons: btns });
  }
  console.log(JSON.stringify(result, null, 1));
  await b.close();
})();