/**
 * 定位「样式重算 458 次但 0 个元素」的真因。
 *
 * 手段：在页面里用 MutationObserver + CSSStyleDeclaration 拦截，
 * 统计拖拽期间：
 *   1. 有多少次 style 写入了哪些属性
 *   2. 写着色器命中最广的 CSS 规则（transition / will-change / filter 等）
 *   3. 页面总元素数、带 transition 的元素数
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();

  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".login-form", { timeout: 45000 });
  await page.waitForSelector(".loading-box", { state: "detached", timeout: 45000 }).catch(() => {});
  await sec(900);
  const inputs = page.locator(".login-input .el-input__inner");
  await inputs.first().fill("admin");
  await inputs.nth(1).fill("admin123");
  await sec(200);
  await page.click(".login-btn", { force: true });
  const track = await page.waitForSelector(".slider-verify-track", { timeout: 12000 }).catch(() => null);
  if (track) {
    await sec(400);
    const r = await track.boundingBox();
    const sx = r.x + r.width * 0.12;
    const ex = r.x + r.width - 4;
    const sy = r.y + r.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 0; i <= 45; i++) {
      await page.mouse.move(sx + ((ex - sx) * i) / 45, sy);
      await sec(10);
    }
    await page.mouse.up();
    await sec(1200);
    await inputs.first().fill("admin");
    await inputs.nth(1).fill("admin123");
    await sec(300);
    await page.click(".login-btn", { force: true });
  }
  await page.waitForURL((u) => !/login/.test(u.pathname), { timeout: 50000 });
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(5000);

  await page.click(".dlg-fps__btn--primary");
  await sec(2000);
  console.log("ReDialog 已打开");

  // ---------- 页面结构统计 ----------
  const stats = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    let withTransition = 0;
    let withWillChange = 0;
    let withFilter = 0;
    let withBackdrop = 0;
    let withAnimation = 0;
    const transitionEls = [];
    for (const el of all) {
      const cs = getComputedStyle(el);
      const tr = cs.transitionProperty;
      if (tr && tr !== "none" && tr !== "all" ? tr !== "none" : false) {
        withTransition++;
        if (transitionEls.length < 25) {
          transitionEls.push({
            tag: el.tagName,
            cls: typeof el.className === "string" ? el.className.slice(0, 60) : "",
            transition: cs.transition.slice(0, 80),
          });
        }
      }
      if (cs.willChange && cs.willChange !== "auto") withWillChange++;
      if (cs.filter && cs.filter !== "none") withFilter++;
      if (cs.backdropFilter && cs.backdropFilter !== "none") withBackdrop++;
      if (cs.animationName && cs.animationName !== "none") withAnimation++;
    }
    return {
      totalElements: all.length,
      withTransition,
      withWillChange,
      withFilter,
      withBackdrop,
      withAnimation,
      transitionSample: transitionEls,
    };
  });
  console.log("\n=== 页面结构 ===");
  console.log(`  总元素数: ${stats.totalElements}`);
  console.log(`  带 transition: ${stats.withTransition}`);
  console.log(`  带 will-change: ${stats.withWillChange}`);
  console.log(`  带 filter: ${stats.withFilter}`);
  console.log(`  带 backdrop-filter: ${stats.withBackdrop}`);
  console.log(`  带动画: ${stats.withAnimation}`);
  console.log("\n  transition 样本:");
  stats.transitionSample.forEach((e) => console.log(`    ${e.tag}.${e.cls}  →  ${e.transition}`));

  // ---------- 拦截 style 写入 ----------
  await page.evaluate(() => {
    const S = { logs: [] };
    window.__S = S;
    const dlg = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    if (!dlg) return;
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "style") {
          const el = r.target;
          S.logs.push({
            tag: el.tagName,
            cls: typeof el.className === "string" ? el.className.slice(0, 50) : "",
            style: el.getAttribute("style")?.slice(0, 120) || "",
            t: performance.now(),
          });
        }
      }
    });
    mo.observe(dlg, { attributes: true, subtree: true, attributeFilter: ["style"] });
    window.__SMO = mo;
  });

  // 拖拽
  const h = await page.locator(".el-dialog__header").first().boundingBox();
  const sx2 = h.x + 80;
  const y2 = h.y + h.height / 2;
  await page.mouse.move(sx2, y2);
  await sec(120);
  await page.mouse.down();
  await sec(80);
  const t0 = Date.now();
  for (let i = 1; i <= 120; i++) {
    await page.mouse.move(sx2 + i * 3, y2 + Math.sin(i * 0.2) * 10);
    const w = t0 + i * 12 - Date.now();
    if (w > 0) await sec(w);
  }
  await page.mouse.up();
  await sec(500);

  const logs = await page.evaluate(() => {
    window.__SMO?.disconnect();
    return window.__S.logs;
  });

  console.log(`\n=== 拖拽期间 style 属性写入: ${logs.length} 次 ===`);
  const byEl = new Map();
  for (const l of logs) {
    const k = `${l.tag}.${l.cls}`;
    byEl.set(k, (byEl.get(k) || 0) + 1);
  }
  [...byEl.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)} 次  ${k}`));

  console.log("\n  最后 3 条 style 内容:");
  logs.slice(-3).forEach((l) => console.log(`    ${l.tag}.${l.cls}  style="${l.style}"`));

  // ---------- 数一下弹窗内的元素数 ----------
  const dlgCount = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? { dialogEls: d.querySelectorAll("*").length, bodyEls: d.querySelector(".dialog-content-wrapper")?.querySelectorAll("*").length } : null;
  });
  console.log("\n弹窗内元素数:", JSON.stringify(dlgCount));

  await sec(500);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
