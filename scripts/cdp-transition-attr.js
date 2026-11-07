/**
 * 把「一次鼠标移动」引起的样式重算，精确归因到「哪个 CSS 属性 + 哪个元素选择器」。
 *
 * 前几轮已确认：
 *   - 弹窗 drag 期间 JS 几乎不花时间（setProperty 0 次、longtask 0 次、offsetHeight 4 次）
 *   - trace 里却有 UpdateLayoutTree 266 次 / 170ms，其中 8 次元素=6 / 2 次元素=100
 *   - 元素=100 的栈顶是 Element Plus el-scrollbar 的 onUpdated(() => update())
 *
 * 本轮做两件事：
 *   1. 用 CSSStyleSheet 的规则遍历，列出「所有带 transition 的选择器」及其命中元素数
 *   2. 逐个关掉（注入 !important 覆盖）后重测，量化每一类的实际贡献
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink", "toplevel"].join(",");

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

  // ---------- 列出所有带 transition 的选择器及其命中元素数 ----------
  const transitions = await page.evaluate(() => {
    const out = [];
    const walk = (rules, href) => {
      for (const r of rules) {
        if (r.cssRules) {
          walk(r.cssRules, href);
          continue;
        }
        if (!r.selectorText || !r.style) continue;
        const tp = r.style.transitionProperty || r.style.transition || "";
        const td = r.style.transitionDuration || "";
        if (!tp) continue;
        let hits = 0;
        try {
          hits = document.querySelectorAll(r.selectorText).length;
        } catch {}
        if (hits > 0) out.push({ sel: r.selectorText.slice(0, 90), prop: tp.slice(0, 70), dur: td, hits });
      }
    };
    for (const sh of document.styleSheets) {
      let rules;
      try {
        rules = sh.cssRules;
      } catch {
        continue;
      }
      walk(rules, sh.href);
    }
    return out.sort((a, b) => b.hits - a.hits);
  });

  console.log("\n=== 命中元素数最多的 transition 规则 TOP 20 ===");
  console.log("  命中数  选择器".padEnd(60) + "过渡属性");
  transitions.slice(0, 20).forEach((t) => {
    console.log(`  ${String(t.hits).padStart(6)}  ${t.sel.padEnd(56)} ${t.prop} / ${t.dur}`);
  });
  const total = transitions.reduce((s, t) => s + t.hits, 0);
  console.log(`\n  共 ${transitions.length} 条规则，累计命中 ${total} 个元素`);

  // ---------- 逐组覆盖测试 ----------
  async function measure(label, css) {
    if (css) await page.addStyleTag({ content: css });
    await sec(500);
    const events = [];
    const onData = (e) => events.push(...e.value);
    cdp.on("Tracing.dataCollected", onData);
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(400);

    const h = await page.locator(".el-dialog__header").first().boundingBox();
    const x0 = h.x + 40;
    const y0 = h.y + h.height / 2;
    await page.mouse.move(x0, y0);
    await sec(80);
    await page.mouse.down();
    await sec(60);
    const t = Date.now();
    for (let i = 1; i <= 120; i++) {
      await page.mouse.move(x0 + i * 1.5, y0 + Math.sin(i * 0.1) * 8);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
    await sec(300);

    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    cdp.off("Tracing.dataCollected", onData);
    await sec(200);

    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    const big = ult.filter((e) => (e.args?.elementCount || 0) >= 50).length;
    console.log(`  ${label.padEnd(34)} 移动=${String(mm.length).padStart(3)} 重算=${String(ult.length).padStart(4)}次/${String(ms + "ms").padStart(7)}  大重算(>=50元素)=${big}`);
    return { label, ult: ult.length, ms, big };
  }

  console.log("\n=== 逐组关掉 transition 的实际贡献 ===");
  const R = [];
  R.push(await measure("0 基线"));

  R.push(await measure("1 关掉所有过渡", `*,*::before,*::after{transition:none!important}`));

  await page.addStyleTag({ content: `*,*::before,*::after{transition:revert!important}` });
  await sec(300);
  R.push(await measure("2 关掉主内容区网格项", `.vgl-item{transition:none!important}`));

  R.push(await measure("3 关掉 el-scrollbar 相关", `.el-scrollbar__wrap,.el-scrollbar__bar{transition:none!important}`));

  R.push(await measure("4 关掉全文档 :hover 过渡", `*:hover{transition:none!important}`));

  console.log("\n==================== 汇总 ====================");
  R.forEach((r) => console.log(`${r.label.padEnd(32)} ${String(r.ult).padStart(5)} 次 / ${String(r.ms + "ms").padStart(8)}`));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
