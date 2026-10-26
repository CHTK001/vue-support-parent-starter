const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on("pageerror", e => errs.push(e.message.slice(0,140)));
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(15000);

  // 先切到 400 节点压力数据
  await p.locator(".prop-dataset .el-segmented__item", { hasText: "压力测试" }).first().click({ force: true });
  await p.waitForTimeout(6000);

  // 标记主画布
  await p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    const cv = s.querySelector("canvas");
    if (cv) cv.__tag = "before";
  });

  const t0 = Date.now();
  await p.locator(".el-form-item", { hasText: "小地图" }).first().locator(".re-switch-square").first().click({ force: true });
  await p.waitForTimeout(2500);
  const elapsed = Date.now() - t0;

  const res = await p.evaluate(() => {
    const s = document.querySelector(".debug__preview-body");
    const cv = s.querySelector("canvas");
    return { sameCanvas: cv ? cv.__tag === "before" : null, hasMinimap: !!s.querySelector(".g6-minimap") };
  });
  console.log(JSON.stringify({ elapsedMsInclWait: elapsed, ...res, recreated: res.sameCanvas === false, errors: [...new Set(errs)].slice(0,3) }, null, 1));
  await b.close();
})();
