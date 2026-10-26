const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:8090/#/debug/ReRelationGraph", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(14000);
  const dump = () => p.evaluate(() => {
    const seg = document.querySelector(".prop-dataset .el-segmented");
    return [...seg.querySelectorAll(".el-segmented__item, .el-segmented__item-selected")].map(o => ({
      cls: String(o.className),
      txt: (o.textContent||"").trim(),
      bg: getComputedStyle(o).backgroundColor,
    }));
  });
  console.log("== 初始 ==", JSON.stringify(await dump(), null, 1));
  await p.locator(".prop-dataset .el-segmented__item", { hasText: "小圈子" }).first().click({ force: true });
  await p.waitForTimeout(1800);
  console.log("== 切到小圈子 ==", JSON.stringify(await dump(), null, 1));
  await b.close();
})();
