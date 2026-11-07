/**
 * A/B 对照：拖拽时给弹窗加「独立合成层」，看能否消掉
 * 「每次 mousemove 触发一次全文档样式重算」。
 *
 * A（基线）：不加任何样式
 * B（实验）：给被拖的 .el-dialog 注入
 *              will-change: transform;
 *              contain: layout style paint;
 *            —— 只加 CSS，不改拖拽逻辑，不改 node_modules
 *
 * 每轮都跑：真实闹钟弹窗拖拽 -> 采集 trace -> 统计
 *   UpdateLayoutTree 次数与总耗时（核心指标）
 *   mousemove 次数
 *   帧间隔 p95 / max / 超33ms
 *
 * 用法：node scripts/cdp-ab-contain.js
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT_DIR = "D:\\ch\\.trace";

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, type: w.type, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));

/** 实验样式：只影响被拖拽的弹窗自身 */
const EXP_CSS = `
.el-dialog.is-draggable {
  will-change: transform;
  contain: layout style paint;
}
`;

const PROBE = () => {
  const P = { gaps: [], longTasks: [], frames: 0, last: 0 };
  window.__D = P;
  const raf = (t) => {
    if (P.last) P.gaps.push(t - P.last);
    P.last = t;
    P.frames++;
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) P.longTasks.push(e.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {}
  P.reset = () => {
    P.gaps = [];
    P.longTasks = [];
    P.frames = 0;
    P.last = 0;
  };
  P.stop = () => {
    const g = P.gaps.slice().sort((a, b) => a - b);
    const q = (p) => (g.length ? g[Math.min(g.length - 1, Math.floor(g.length * p))] : 0);
    return {
      fps: g.length ? +(1000 / (g.reduce((a, b) => a + b, 0) / g.length)).toFixed(1) : 0,
      p95: +q(0.95).toFixed(2),
      max: g.length ? +g[g.length - 1].toFixed(2) : 0,
      over33: g.filter((x) => x > 33.4).length,
      longTasks: P.longTasks.length,
    };
  };
};

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  // ---------- 登录 ----------
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

  // 注入布局并回到首页
  await page.evaluate(async ([widgets, grid]) => {
    const u = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/utils/src/index.ts");
    u.writeLayoutCache({ widgets, grid });
  }, [WIDGETS, GRID]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(7000);
  await page.evaluate(PROBE);
  console.log("首页就绪（真实闹钟/书签/快捷入口已渲染）");

  /** 跑一轮：打开闹钟弹窗 -> 拖拽 -> 采集 -> 关闭 */
  async function runRound(label, injectCss) {
    await page.click(".aw__add", { force: true });
    await sec(1800);

    if (injectCss) {
      await page.addStyleTag({ content: EXP_CSS });
      await sec(400);
    }
    const styleApplied = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      if (!d) return null;
      const cs = getComputedStyle(d);
      return { willChange: cs.willChange, contain: cs.contain };
    });

    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", {
      categories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "blink.user_timing",
        "latencyInfo",
        "benchmark",
        "v8.execute",
        "cc",
        "gpu",
        "blink",
        "toplevel",
      ].join(","),
      options: "sampling-frequency=10000",
      transferMode: "ReportEvents",
    });
    await sec(900);

    await page.evaluate(() => window.__D.reset());
    const h = await page.locator(".el-dialog__header").first().boundingBox();
    const sx2 = h.x + 60;
    const y2 = h.y + h.height / 2;
    await page.mouse.move(sx2, y2);
    await sec(150);
    await page.mouse.down();
    await sec(100);
    const tStart = Date.now();
    const MOVES = 260;
    for (let i = 1; i <= MOVES; i++) {
      await page.mouse.move(sx2 + i * 1.6, y2 + Math.sin(i * 0.15) * 12);
      const w = tStart + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
    await sec(600);
    const frame = await page.evaluate(() => window.__D.stop());

    const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    await done;
    await sec(400);

    // 统计
    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const paint = xs.filter((e) => e.name === "Paint");
    const commit = xs.filter((e) => e.name === "Commit");
    const sum = (l) => +(l.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    const durs = ult.map((e) => e.dur / 1000).sort((a, b) => a - b);
    const q = (p) => (durs.length ? +durs[Math.min(durs.length - 1, Math.floor(durs.length * p))].toFixed(3) : 0);

    const row = {
      label,
      styleApplied,
      mousemoves: mm.length,
      ultCount: ult.length,
      ultMs: sum(ult),
      ultPerMove: mm.length ? +(ult.length / mm.length).toFixed(2) : 0,
      ultP50: q(0.5),
      ultP95: q(0.95),
      paintCount: paint.length,
      paintMs: sum(paint),
      commitCount: commit.length,
      fps: frame.fps,
      p95: frame.p95,
      max: frame.max,
      over33: frame.over33,
      longTasks: frame.longTasks,
    };

    // 存一份 trace 备查
    fs.writeFileSync(
      path.join(OUT_DIR, `ab-${injectCss ? "B-contain" : "A-base"}.json`),
      JSON.stringify({ traceEvents: events }),
      "utf8"
    );

    // 关闭弹窗
    await page.keyboard.press("Escape");
    await sec(1500);
    // 清掉注入的样式
    await page.evaluate(() => {
      document.querySelectorAll("style").forEach((s) => {
        if (s.textContent && s.textContent.includes("will-change: transform")) s.remove();
      });
    });
    await sec(600);

    return row;
  }

  const a = await runRound("A 基线（无额外样式）", false);
  const b = await runRound("B 合成层（will-change + contain）", true);

  console.log("\n==================== A/B 结果 ====================");
  const cols = [
    ["项目", (r) => r.label],
    ["will-change", (r) => (r.styleApplied ? r.styleApplied.willChange : "?")],
    ["contain", (r) => (r.styleApplied ? r.styleApplied.contain : "?")],
    ["mousemove 次数", (r) => r.mousemoves],
    ["样式重算次数", (r) => r.ultCount],
    ["重算/每次移动", (r) => r.ultPerMove],
    ["重算总耗时 ms", (r) => r.ultMs],
    ["单次重算 p50 ms", (r) => r.ultP50],
    ["单次重算 p95 ms", (r) => r.ultP95],
    ["Paint 次数/耗时", (r) => `${r.paintCount} / ${r.paintMs}ms`],
    ["Commit 次数", (r) => r.commitCount],
    ["帧间隔 p95 ms", (r) => r.p95],
    ["帧间隔 max ms", (r) => r.max],
    ["超33ms 帧", (r) => r.over33],
    ["长任务", (r) => r.longTasks],
  ];
  const w = (s) => String(s).padEnd(22);
  console.log(w("") + w("A 基线") + "B 合成层");
  cols.forEach(([name, fn]) => console.log(w(name) + w(fn(a)) + fn(b)));

  await sec(500);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
