const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(15000);

  const item = p.locator(".el-form-item", { hasText: "小地图" }).first();
  const btn = item.locator(".re-switch-square").first();
  const beforeActive = await btn.evaluate(el => el.classList.contains("re-switch-square--active"));
  await btn.click({ force: true });
  await p.waitForTimeout(2500);
  const afterActive = await btn.evaluate(el => el.classList.contains("re-switch-square--active"));

  const doc = await p.evaluate(() => {
    return {
      wideMini: [...document.querySelectorAll("*")].filter(e => /mini/i.test(String(e.className||""))).map(e => String(e.className).slice(0,60)).slice(0,8),
      canvases: document.querySelectorAll("canvas").length,
    };
  });
  console.log(JSON.stringify({ beforeActive, afterActive, doc }, null, 1));
  await b.close();
})();
