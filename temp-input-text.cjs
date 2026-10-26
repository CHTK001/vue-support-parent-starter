const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on("pageerror", e => errs.push(e.message.slice(0,150)));

  // ---- ReInput ----
  await p.goto("http://localhost:8090/#/debug/ReInput", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(12000);
  const inputInfo = await p.evaluate(() => {
    const scope = document.querySelector(".debug__preview-body");
    const wrap = scope.querySelector(".el-input__wrapper");
    if (!wrap) return { found: false };
    const cs = getComputedStyle(wrap);
    return { found: true, radius: cs.borderRadius, radiusVar: getComputedStyle(scope.querySelector(".el-input")).getPropertyValue("--el-input-border-radius").trim() };
  });

  // 切到 modern 布局 + 打开专注模式
  await p.locator('.re-select-square__item[title^="modern"]').first().click({ force: true });
  await p.waitForTimeout(1200);
  const focusItem = p.locator(".el-form-item", { hasText: "专注模式" }).first();
  await focusItem.locator(".re-switch-square").first().click({ force: true });
  await p.waitForTimeout(1000);
  const focusInfo = await p.evaluate(() => {
    const scope = document.querySelector(".debug__preview-body");
    const icon = scope.querySelector("[class*=focus]");
    return { hasFocusIcon: !!icon, cls: icon ? String(icon.className).slice(0,80) : null };
  });

  // ---- ReText ----
  await p.goto("http://localhost:8090/#/debug/ReText", { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(12000);
  const textInfo = await p.evaluate(() => {
    const scope = document.querySelector(".debug__preview-body");
    const t = scope.querySelector(".re-text, .el-text");
    return { found: !!t, text: t ? (t.textContent||"").trim().slice(0,60) : null, tag: t ? t.tagName.toLowerCase() : null };
  });

  console.log(JSON.stringify({ inputInfo, focusInfo, textInfo, errors: [...new Set(errs)].slice(0,4) }, null, 1));
  await b.close();
})();
