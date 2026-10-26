const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(15000);
  const before = await p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    return { canvases: s.querySelectorAll("canvas").length, cls: [...s.querySelectorAll("div")].map(d=>String(d.className)).filter(c=>/mini/i.test(c)) };
  });
  await p.locator(".el-form-item", { hasText: "小地图" }).first().locator(".re-switch-square").first().click({ force: true });
  await p.waitForTimeout(2500);
  const after = await p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    return { canvases: s.querySelectorAll("canvas").length, cls: [...s.querySelectorAll("div")].map(d=>String(d.className)).filter(c=>/mini/i.test(c)) };
  });
  console.log(JSON.stringify({ before, after }, null, 1));
  await b.close();
})();
