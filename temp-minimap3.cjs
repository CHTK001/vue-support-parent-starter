const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const logs = [];
  p.on("console", m => logs.push(m.type()+": "+m.text().slice(0,160)));
  p.on("pageerror", e => logs.push("ERR "+e.message.slice(0,160)));
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(15000);

  const snapshot = () => p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    return {
      total: s.querySelectorAll("*").length,
      mini: [...s.querySelectorAll("*")].map(e => String(e.className)).filter(c => typeof c === "string" && /mini/i.test(c)),
      tags: [...s.children].map(c => c.tagName + "." + String(c.className).slice(0,40)),
    };
  });
  const before = await snapshot();
  await p.locator(".el-form-item", { hasText: "小地图" }).first().locator(".re-switch-square").first().click({ force: true });
  await p.waitForTimeout(3000);
  const after = await snapshot();
  console.log(JSON.stringify({ before, after, logs: [...new Set(logs)].slice(0,8) }, null, 1));
  await b.close();
})();
