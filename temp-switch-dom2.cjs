const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:8090/#/debug/ReSwitch", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(12000);
  // 点开布局下拉
  await p.locator(".re-select-square").first().click({ force: true });
  await p.waitForTimeout(900);
  const pop = await p.evaluate(() => {
    const nodes = [...document.querySelectorAll("body > div")].map(d => String(d.className)).filter(c => c && !c.includes("el-popper") === false || c.includes("re-"));
    const opts = [...document.querySelectorAll("[class*=select] [class*=option], .el-select-dropdown__item, [role=option]")].map(o => ({ cls: String(o.className).slice(0,70), text: (o.textContent||"").trim().slice(0,20) }));
    return { poppers: [...new Set(nodes)].slice(0,12), opts: opts.slice(0,12) };
  });
  console.log(JSON.stringify(pop, null, 1));
  await b.close();
})();
