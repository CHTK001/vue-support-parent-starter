const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on("pageerror", e => errs.push(e.message.slice(0,140)));
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(15000);

  await p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    const cv = s.querySelector("canvas");
    if (cv) cv.__tag = "before";
  });

  const t0 = Date.now();
  const item = p.locator(".el-form-item", { hasText: "小地图" }).first();
  const btn = item.locator(".re-switch-square").first();
  await btn.click({ force: true });
  await p.waitForTimeout(2500);
  const toggled = Date.now() - t0;

  const res = await p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    const cv = s.querySelector("canvas");
    return { sameCanvas: cv ? cv.__tag === "before" : null, hasMinimap: !!s.querySelector(".g6-minimap") };
  });

  await p.locator(".el-form-item", { hasText: "小地图" }).first().locator(".re-switch-square").first().click({ force: true });
  await p.waitForTimeout(2000);
  const off = await p.evaluate(() => !!document.querySelector(".debug__preview-body .g6-minimap"));

  console.log(JSON.stringify({ toggledMs: toggled, ...res, recreated: res.sameCanvas === false, minimapAfterOff: off, errors: [...new Set(errs)].slice(0,3) }, null, 1));
  await b.close();
})();
