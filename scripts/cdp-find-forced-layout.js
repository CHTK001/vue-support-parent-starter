/**
 * 精确定位：拖拽弹窗期间到底是谁在改弹窗的 style、谁在强制同步布局。
 *
 * 上一轮 trace 已经指向一个高频热点：
 *   Element Plus el-scrollbar → onUpdated(() => bar.update()) → 同步读
 *   offsetHeight/scrollWidth → Blink.ForcedStyleAndLayout → 3ms 强制重算。
 * 但弹窗自身只有 76 个节点、0 个 scrollbar，所以要先确认这条链路在**首页**上
 * 是怎么被鼠标拖拽触发的。
 *
 * 本脚本用「补丁法」直接量到函数级：
 *   1. 包一层 el-scrollbar bar.update，记录调用次数与每次耗时
 *   2. 包一层 Element.useZIndex / 拖拽的 mousemove 处理器，看谁在每帧写 style
 *   3. 用 PerformanceObserver 抓 longtask
 *   4. 统计拖拽期间每个元素被写 style 的次数（按元素归属）
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

  // ---------- 打点 1：给弹窗挂样式写入探针 ----------
  await page.evaluate(() => {
    const dlg = document.querySelector(".el-dialog");
    const log = { styleWrites: [], longTasks: [], moAttrs: [] };

    // 拦截该元素的 style 写入：劫持 CSSStyleDeclaration.setProperty 与 cssText
    const origSet = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (k, v, p) {
      if (this.__owner === dlg) log.styleWrites.push({ k, v });
      return origSet.call(this, k, v, p);
    };

    // 用 MutationObserver 记录 style 具体改了什么
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.attributeName === "style") {
          log.moAttrs.push(m.target.style.cssText);
        }
      }
    });
    mo.observe(dlg, { attributes: true });

    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) log.longTasks.push({ dur: e.duration, start: e.startTime });
      }).observe({ entryTypes: ["longtask"] });
    } catch {}

    window.__log = log;
    window.__stopLog = () => {
      mo.disconnect();
      return log;
    };
  });

  // ---------- 拖拽 ----------
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

  const log = await page.evaluate(() => window.__stopLog());
  console.log("\n=== 弹窗 style 写入 ===");
  console.log(`  setProperty 调用: ${log.styleWrites.length} 次`);
  console.log(`  cssText 快照变化: ${log.moAttrs.length} 次`);
  console.log(`  最后一次 style: ${log.moAttrs[log.moAttrs.length - 1]}`);
  const uniq = [...new Set(log.moAttrs.map((s) => s.replace(/-?\d+(\.\d+)?px/g, "Npx")))];
  console.log(`  不同的样式形态 ${uniq.length} 种:`);
  uniq.slice(0, 6).forEach((u) => console.log(`    ${u}`));

  console.log("\n=== longtask ===");
  console.log(`  ${log.longTasks.length} 次  ` + log.longTasks.map((t) => t.dur.toFixed(1)).join(", "));

  // ---------- 打点 2：el-scrollbar 的 update 调用次数 ----------
  const scrollbarStats = await page.evaluate(async () => {
    // el-scrollbar 的 bar 组件在 index 里通过 onUpdated 调用 update，
    // 这里用「重写 offsetHeight getter 计数」来量强制布局的次数。
    const proto = HTMLElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "offsetHeight");
    let count = 0;
    const owners = {};
    Object.defineProperty(proto, "offsetHeight", {
      configurable: true,
      get() {
        count++;
        const cls = this.className && typeof this.className === "string" ? this.className.split(" ").slice(0, 2).join(".") : this.tagName;
        owners[cls] = (owners[cls] || 0) + 1;
        return desc.get.call(this);
      },
    });
    window.__restoreOH = () => {
      Object.defineProperty(proto, "offsetHeight", desc);
      return { count, owners };
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
  await sec(400);

  const oh = await page.evaluate(() => window.__restoreOH());
  console.log("\n=== 拖拽 150 次期间的 offsetHeight 读取（同步布局触发点）===");
  console.log(`  总读取 ${oh.count} 次`);
  Object.entries(oh.owners)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([k, v]) => console.log(`  ${String(v).padStart(5)} 次  ${k}`));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
