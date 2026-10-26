const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on("pageerror", e => errs.push(e.message.slice(0,150)));
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(14000);

  const state = () => p.evaluate(() => {
    const seg = document.querySelector(".prop-dataset .el-segmented");
    const checked = seg ? (seg.querySelector(".el-segmented__item-selected")?.textContent || "").trim() : null;
    const opts = seg ? [...seg.querySelectorAll(".el-segmented__item")].map(o => o.textContent.trim()) : [];
    const hint = (document.querySelector(".prop-dataset__hint")?.textContent || "").trim();
    const adv = !!document.querySelector(".prop-advanced");
    const canvas = document.querySelector(".debug__preview-body canvas, .debug__preview-body svg");
    return { selected: checked, opts, hint: hint.slice(0, 70), hasAdvanced: adv, hasGraph: !!canvas };
  });

  const out = { initial: await state() };
  // 切到「小圈子」
  const seg = p.locator(".prop-dataset .el-segmented__item", { hasText: "小圈子" }).first();
  if (await seg.count()) { await seg.click({ force: true }); await p.waitForTimeout(2200); }
  out.afterSmall = await state();
  // 切到「压力测试」
  const seg2 = p.locator(".prop-dataset .el-segmented__item", { hasText: "压力测试" }).first();
  if (await seg2.count()) { await seg2.click({ force: true }); await p.waitForTimeout(4000); }
  out.afterStress = await state();
  out.errors = [...new Set(errs)].slice(0,4);
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
