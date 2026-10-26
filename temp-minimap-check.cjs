const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on("pageerror", e => errs.push(e.message.slice(0,150)));
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(15000);

  // 标记画布元素：整图重建会换掉 canvas 节点
  const markAndToggle = await p.evaluate(async () => {
    const scope = document.querySelector(".debug__preview-body");
    const cv = scope.querySelector("canvas");
    if (!cv) return { found: false };
    cv.__probeTag = "before";
    const btn = [...document.querySelectorAll(".el-form-item")].find(fi => (fi.textContent||"").includes("小地图"));
    return { found: true, hasMinimapField: !!btn };
  });

  // 点开小地图
  const item = p.locator(".el-form-item", { hasText: "小地图" }).first();
  await item.locator(".re-switch-square").first().click({ force: true });
  await p.waitForTimeout(2500);

  const after = await p.evaluate(() => {
    const scope = document.querySelector(".debug__preview-body");
    const cv = scope.querySelector("canvas");
    const minimap = scope.querySelector("[class*=minimap], [class*=Minimap]");
    return { sameCanvas: cv ? cv.__probeTag === "before" : null, hasMinimap: !!minimap };
  });

  console.log(JSON.stringify({ markAndToggle, after, recreated: after.sameCanvas === false, errors: [...new Set(errs)].slice(0,4) }, null, 1));
  await b.close();
})();
