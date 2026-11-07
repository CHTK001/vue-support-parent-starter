/**
 * 拖拽弹窗时的 JS 侧行为画像。
 *
 * 已确认的线索：trace 里 CallFunction -> RunMicrotasks -> Blink.ForcedStyleAndLayout
 * -> UpdateLayoutTree(元素=100)，栈顶是 Element Plus 的 el-scrollbar：
 *     update() { barRef.value?.update(); ... }
 *     onUpdated(() => update());
 * 即在组件更新后同步读 offsetHeight/scrollHeight，强制同步布局。
 *
 * 本脚本在页面里打点，回答三个问题：
 *   1. 拖拽期间 Vue 组件更新了多少次（弹窗 vnode 更新 / 整个 app 更新）
 *   2. 每次更新的来源：是 mousemove 驱动的样式绑定，还是别的东西
 *   3. 弹窗 DOM 里有多少个 el-scrollbar（每个都会在更新时强制布局）
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, type: w.type, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".login-form", { timeout: 150000 });
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
  await sec(6000);
  await page.evaluate(async ([widgets, grid]) => {
    const u = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/utils/src/index.ts");
    u.writeLayoutCache({ widgets, grid });
  }, [WIDGETS, GRID]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-card", { timeout: 150000 });
  await sec(8000);
  console.log("首页就绪");

  await page.click(".aw__add", { force: true });
  await sec(2000);
  await page.waitForSelector(".el-dialog", { timeout: 10000 });
  console.log("弹窗已打开");

  // ---------- 弹窗结构画像 ----------
  const info = await page.evaluate(() => {
    const dlg = document.querySelector(".el-dialog");
    const q = (sel) => dlg.querySelectorAll(sel).length;
    return {
      scrollbars: q(".el-scrollbar"),
      scrollbarWraps: q(".el-scrollbar__wrap"),
      textareas: q("textarea"),
      inputs: q(".el-input__inner"),
      selects: q(".el-select"),
      tooltips: q(".el-tooltip__trigger"),
      trs: q("tr"),
      nodes: dlg.querySelectorAll("*").length,
      dialogClass: dlg.className,
      hasDragHandler: !!dlg.querySelector(".el-dialog__header"),
      // 首页整体
      pageScrollbars: document.querySelectorAll(".el-scrollbar").length,
      pageNodes: document.body.querySelectorAll("*").length,
    };
  });
  console.log("\n=== 弹窗结构 ===");
  console.log(JSON.stringify(info, null, 1));

  // ---------- 打点：统计拖拽期间的 Vue 组件更新 / DOM 变更 ----------
  const res = await page.evaluate(async () => {
    const dlg = document.querySelector(".el-dialog");
    const stats = { mutations: 0, attrMutations: 0, attrNames: {}, updatedTicks: 0, rafGap: [] };
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        stats.mutations++;
        if (m.type === "attributes") {
          stats.attrMutations++;
          const k = m.attributeName;
          stats.attrNames[k] = (stats.attrNames[k] || 0) + 1;
        }
      }
    });
    mo.observe(dlg, { attributes: true, childList: true, subtree: true, characterData: true });

    // 记录每帧确认执行了哪些布局读取（用 getBoundingClientRect 包一层计数太粗，
    // 这里只统计 rAF 帧间隔与 DOM 变更的对应关系）
    let last = 0;
    const tick = (t) => {
      if (last) stats.rafGap.push(+(t - last).toFixed(2));
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    window.__stats = stats;
    window.__stop = () => {
      mo.disconnect();
      return stats;
    };
    return true;
  });

  // 拖拽 150 次
  const h = await page.locator(".el-dialog__header").first().boundingBox();
  const x0 = h.x + 60;
  const y0 = h.y + h.height / 2;
  await page.mouse.move(x0, y0);
  await sec(150);
  await page.mouse.down();
  await sec(100);
  const t0 = Date.now();
  for (let i = 1; i <= 150; i++) {
    await page.mouse.move(x0 + i * 1.6, y0 + Math.sin(i * 0.12) * 10);
    const w = t0 + i * 8 - Date.now();
    if (w > 0) await sec(w);
  }
  await page.mouse.up();
  await sec(500);

  const stats = await page.evaluate(() => window.__stop());
  console.log("\n=== 拖拽 150 次期间的 DOM 变更 ===");
  console.log(`  总变更 ${stats.mutations} 次，其中属性变更 ${stats.attrMutations} 次`);
  console.log("  属性名分布: " + JSON.stringify(stats.attrNames));
  const gaps = stats.rafGap.slice(1).sort((a, b) => a - b);
  const p = (q) => gaps[Math.floor(gaps.length * q)] ?? 0;
  console.log(`  帧间隔: 帧数=${gaps.length} p50=${p(0.5)} p95=${p(0.95)} max=${gaps[gaps.length - 1]}`);

  // ---------- 每次 DOM 变更的触发者（记录 attribute 变更时最外层受影响元素） ----------
  const who = await page.evaluate(async () => {
    const dlg = document.querySelector(".el-dialog");
    const seen = {};
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type !== "attributes") continue;
        const el = m.target;
        const path = [];
        let n = el;
        while (n && n !== dlg && path.length < 4) {
          path.push(n.tagName.toLowerCase() + (n.className && typeof n.className === "string" ? "." + n.className.split(" ")[0] : ""));
          n = n.parentElement;
        }
        const k = path.join(" < ") + " [" + m.attributeName + "]";
        seen[k] = (seen[k] || 0) + 1;
      }
    });
    mo.observe(dlg, { attributes: true, subtree: true });
    window.__who = seen;
    window.__whoStop = () => {
      mo.disconnect();
      return seen;
    };
    return true;
  });

  const h2 = await page.locator(".el-dialog__header").first().boundingBox();
  const ax = h2.x + 60;
  const ay = h2.y + h2.height / 2;
  await page.mouse.move(ax, ay);
  await sec(150);
  await page.mouse.down();
  await sec(100);
  const t1 = Date.now();
  for (let i = 1; i <= 150; i++) {
    await page.mouse.move(ax + i * 1.6, ay + Math.sin(i * 0.12) * 10);
    const w = t1 + i * 8 - Date.now();
    if (w > 0) await sec(w);
  }
  await page.mouse.up();
  await sec(500);

  const whoStats = await page.evaluate(() => window.__whoStop());
  console.log("\n=== 属性变更来源 TOP 15 ===");
  Object.entries(whoStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([k, v]) => console.log(`  ${String(v).padStart(5)} 次  ${k}`));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
