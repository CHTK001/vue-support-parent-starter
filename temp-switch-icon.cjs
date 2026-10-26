const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:8090/#/debug/ReSwitch", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(13000);
  await p.locator('.re-select-square__item[title^="square"]').first().click({ force: true });
  await p.waitForTimeout(1200);

  const read = () => p.evaluate(() => {
    const scope = document.querySelector(".debug__preview-body");
    const wrap = scope.querySelector(".re-switch-square-wrap");
    const btn = wrap.querySelector(".re-switch-square");
    // 去掉注释，只看真实节点
    const label = btn.querySelector(".re-switch-square__label");
    const clone = label.cloneNode(true);
    clone.querySelectorAll("*").forEach(n => {});
    const html = clone.innerHTML.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();
    // 两层图标各自的名字（ReIcon 会渲染成 svg 或 i）
    const layers = [...label.querySelectorAll(":scope > span, :scope > svg, :scope > i")].map(n => ({
      cls: String(n.className).slice(0, 60),
      inner: n.innerHTML.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim().slice(0, 80),
    }));
    return { active: btn.classList.contains("re-switch-square--active"), html: html.slice(0, 200), layerCount: layers.length, layers };
  });

  const before = await read();
  await p.locator(".debug__preview-body .re-switch-square").first().click({ force: true });
  await p.waitForTimeout(900);
  const after = await read();
  console.log(JSON.stringify({ before, after, changed: before.html !== after.html }, null, 1));
  await b.close();
})();
