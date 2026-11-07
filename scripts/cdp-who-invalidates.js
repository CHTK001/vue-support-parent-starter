/**
 * 找出「每次 mousemove 都重算样式」的真正触发者。
 *
 * 线索：contain/will-change 让 Paint 从 533 降到 18，但 UpdateLayoutTree 不变，
 * 说明重算不是弹窗自身。那么是谁？
 *
 * 手段：在页面里挂钩三类「会标脏样式」的操作，拖拽时统计各自的调用次数：
 *   1. getComputedStyle()  —— 读样式会强制 flush（旧值无法区分，但调用量大就是元凶）
 *   2. el.style.* 写入     —— 覆盖 CSSStyleDeclaration 的 setProperty / 属性 setter
 *   3. class 变更          —— MutationObserver 统计
 *
 * 同时记录「一次拖拽期间各元素被写 style 的次数」排行。
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
  await sec(6000);

  await page.evaluate(async ([widgets, grid]) => {
    const u = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/utils/src/index.ts");
    u.writeLayoutCache({ widgets, grid });
  }, [WIDGETS, GRID]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(7000);

  // 打开闹钟弹窗
  await page.click(".aw__add", { force: true });
  await sec(2000);

  // ---------- 装探针：只要在 armed 之后发生的才记 ----------
  await page.evaluate(() => {
    const S = {
      armed: false,
      styleWrites: [],   // {sel, prop}
      classChanges: [],  // {sel, added, removed}
      getComputed: 0,
      getBounding: 0,
    };
    window.__S = S;

    const sel = (el) => {
      if (!el) return "?";
      const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "";
      return `${el.tagName}${cls ? "." + cls : ""}`;
    };

    // 1. style 写入：拦截 setProperty / cssText / transform 等常见属性
    const proto = CSSStyleDeclaration.prototype;
    const props = ["transform", "top", "left", "width", "height", "margin", "padding", "opacity", "color"];
    props.forEach((p) => {
      const d = Object.getOwnPropertyDescriptor(proto, p);
      if (!d || !d.set) return;
      Object.defineProperty(proto, p, {
        ...d,
        set(v) {
          if (S.armed) S.styleWrites.push({ prop: p, v: String(v).slice(0, 40) });
          return d.set.call(this, v);
        },
      });
    });

    // 2. class 变更
    const mo = new MutationObserver((recs) => {
      if (!S.armed) return;
      for (const r of recs) {
        if (r.attributeName === "class") {
          S.classChanges.push({ el: sel(r.target) });
        }
      }
    });
    mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["class"] });
    window.__SMO = mo;

    // 3. 读样式 / 读布局（无法区分是否强制 flush，但计数能说明热度）
    const ogcs = window.getComputedStyle;
    window.getComputedStyle = function (...a) {
      if (S.armed) S.getComputed++;
      return ogcs.apply(this, a);
    };
    const ogbcr = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...a) {
      if (S.armed) S.getBounding++;
      return ogbcr.apply(this, a);
    };

    S.reset = () => {
      S.styleWrites = [];
      S.classChanges = [];
      S.getComputed = 0;
      S.getBounding = 0;
      S.armed = true;
    };
    S.stop = () => {
      S.armed = false;
      const byProp = {};
      S.styleWrites.forEach((w) => (byProp[w.prop] = (byProp[w.prop] || 0) + 1));
      const byCls = {};
      S.classChanges.forEach((c) => (byCls[c.el] = (byCls[c.el] || 0) + 1));
      return {
        styleWrites: S.styleWrites.length,
        byProp,
        sample: S.styleWrites.slice(0, 6),
        classChanges: S.classChanges.length,
        byClass: Object.entries(byCls).sort((a, b) => b[1] - a[1]).slice(0, 8),
        getComputedStyle: S.getComputed,
        getBoundingClientRect: S.getBounding,
      };
    };
  });

  // ---------- 拖拽 ----------
  await page.evaluate(() => window.__S.reset());
  const h = await page.locator(".el-dialog__header").first().boundingBox();
  const sx2 = h.x + 60;
  const y2 = h.y + h.height / 2;
  await page.mouse.move(sx2, y2);
  await sec(150);
  await page.mouse.down();
  await sec(100);
  const tStart = Date.now();
  for (let i = 1; i <= 200; i++) {
    await page.mouse.move(sx2 + i * 1.6, y2 + Math.sin(i * 0.15) * 10);
    const w = tStart + i * 8 - Date.now();
    if (w > 0) await sec(w);
  }
  await page.mouse.up();
  const s = await page.evaluate(() => window.__S.stop());

  console.log(`\n=== 拖拽 200 次 mousemove 期间的标脏操作 ===`);
  console.log(`  style 写入:        ${s.styleWrites}`);
  console.log(`   按属性: ${JSON.stringify(s.byProp)}`);
  console.log(`   样本: ${JSON.stringify(s.sample)}`);
  console.log(`  class 变更:        ${s.classChanges}`);
  console.log(`   按元素: ${JSON.stringify(s.byClass)}`);
  console.log(`  getComputedStyle:  ${s.getComputedStyle}`);
  console.log(`  getBoundingClientRect: ${s.getBoundingClientRect}`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
