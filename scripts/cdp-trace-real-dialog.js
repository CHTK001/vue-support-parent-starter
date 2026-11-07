/**
 * 用真实业务弹窗抓 Performance trace。
 *
 * 与之前的对比面板不同：这里操作的是系统里真实存在的业务弹窗
 * （闹钟 / 快捷添加 / 书签 / 自定义组件设置），内容是真实表单项。
 *
 * 用法：
 *   node scripts/cdp-trace-real-dialog.js --alarm
 *   node scripts/cdp-trace-real-dialog.js --quick
 *   node scripts/cdp-trace-real-dialog.js --el        # 原生 el-dialog 对照
 *   node scripts/cdp-trace-real-dialog.js --alarm --no-trace   # 只测帧，不存 trace
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT_DIR = "D:\\ch\\.trace";

const arg = (f) => process.argv.includes(f);
const SCENARIOS = {
  alarm: { name: "闹钟设置(真实业务)", open: "alarm" },
  quick: { name: "添加快捷(真实业务)", open: "quick" },
  bookmark: { name: "书签编辑(真实业务)", open: "bookmark" },
  probe: { name: "对比面板 ReDialog", open: "probe" },
  el: { name: "对比面板 原生el-dialog", open: "el" },
};
const key = Object.keys(SCENARIOS).find((k) => arg(`--${k}`)) || "alarm";
const SCN = SCENARIOS[key];
const DO_TRACE = !arg("--no-trace");

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
    const avg = g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
    return {
      frames: P.frames,
      fps: avg > 0 ? +(1000 / avg).toFixed(1) : 0,
      p50: +q(0.5).toFixed(2),
      p95: +q(0.95).toFixed(2),
      p99: +q(0.99).toFixed(2),
      max: g.length ? +g[g.length - 1].toFixed(2) : 0,
      over33: g.filter((x) => x > 33.4).length,
      longTasks: P.longTasks.length,
      longTaskMs: +P.longTasks.reduce((a, b) => a + b, 0).toFixed(1),
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
  console.log("首页就绪");

  // 首页布局存在 window.__LAYOUT_SEED__ 里，每次新会话都是空的，先注入
  const WIDGETS = [
    { id: "seed-alarm", type: "alarm", title: "闹钟" },
    { id: "seed-bookmark", type: "bookmark", title: "书签" },
    { id: "seed-quick", type: "quick-access", title: "快捷入口" },
  ];
  const GRID = WIDGETS.map((w, i) => ({ i: w.id, type: w.type, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));
  await page.evaluate(async ([widgets, grid]) => {
    const u = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/utils/src/index.ts");
    u.writeLayoutCache({ widgets, grid });
  }, [WIDGETS, GRID]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(7000);
  console.log("已注入真实业务组件布局");

  // ---------- 按场景打开弹窗 ----------
  let opened = false;
  const tryClick = async (sel) => {
    const loc = page.locator(sel).first();
    if ((await loc.count()) === 0) return false;
    await loc.click({ force: true });
    await sec(1800);
    return true;
  };

  if (SCN.open === "alarm") {
    opened = await tryClick(".aw__add");
    if (!opened) opened = await tryClick(".aw__empty-btn");
  } else if (SCN.open === "quick") {
    opened = await tryClick(".qw__add-btn");
    if (!opened) opened = await tryClick(".qw__empty-btn");
  } else if (SCN.open === "bookmark") {
    opened = await tryClick(".bw__add");
    if (!opened) opened = await tryClick(".bw__empty-btn");
  } else if (SCN.open === "probe") {
    opened = await tryClick(".dlg-fps__btn--primary");
  } else if (SCN.open === "el") {
    opened = await tryClick(".dlg-fps__btn:not(.dlg-fps__btn--primary)");
  }

  const dlgInfo = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    if (!d) return null;
    return {
      cls: d.className,
      els: d.querySelectorAll("*").length,
      title: d.querySelector(".el-dialog__title, .koi-dialog-title")?.textContent?.trim() || "",
      hasForm: !!d.querySelector(".el-form"),
      scrollHosts: [...d.querySelectorAll("*")]
        .filter((e) => {
          const cs = getComputedStyle(e);
          return /auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2;
        })
        .map((e) => ({ cls: typeof e.className === "string" ? e.className.slice(0, 48) : "", sh: e.scrollHeight, ch: e.clientHeight })),
    };
  });

  if (!dlgInfo) {
    console.log(`\n[${SCN.name}] 没打开弹窗`);
    await browser.close();
    process.exit(2);
  }
  console.log(`\n[${SCN.name}] 弹窗 class=${dlgInfo.cls}`);
  console.log(`  元素数=${dlgInfo.els}  含表单=${dlgInfo.hasForm}  标题="${dlgInfo.title}"`);
  console.log(`  可滚动容器: ${JSON.stringify(dlgInfo.scrollHosts)}`);

  await page.evaluate(PROBE);

  // ---------- 开录 ----------
  const events = [];
  if (DO_TRACE) {
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", {
      categories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "blink.user_timing",
        "latencyInfo",
        "benchmark",
        "v8.execute",
        "disabled-by-default-devtools.timeline.frame",
        "cc",
        "gpu",
        "blink",
        "toplevel",
        "rail",
      ].join(","),
      options: "sampling-frequency=10000",
      transferMode: "ReportEvents",
    });
    await sec(1000);
  }

  // ---------- 拖拽 ----------
  await page.evaluate(() => window.__D.reset());
  const h = await page.locator(".el-dialog__header").first().boundingBox();
  const sx2 = h.x + 60;
  const y2 = h.y + h.height / 2;
  await page.mouse.move(sx2, y2);
  await sec(150);
  await page.mouse.down();
  await sec(100);
  const tStart = Date.now();
  for (let i = 1; i <= 260; i++) {
    await page.mouse.move(sx2 + i * 1.6, y2 + Math.sin(i * 0.15) * 12);
    const w = tStart + i * 8 - Date.now();
    if (w > 0) await sec(w);
  }
  await page.mouse.up();
  await sec(600);
  const dragStat = await page.evaluate(() => window.__D.stop());

  console.log(
    `\n【${SCN.name} 拖拽】fps=${dragStat.fps} p50=${dragStat.p50} p95=${dragStat.p95} p99=${dragStat.p99} max=${dragStat.max} 超33ms=${dragStat.over33} 长任务=${dragStat.longTasks}个/${dragStat.longTaskMs}ms`
  );

  // ---------- 结束录制 ----------
  if (DO_TRACE) {
    const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    await done;
  }

  await sec(400);
  await browser.close();

  if (!DO_TRACE) return;

  console.log(`\n收到 ${events.length} 个 trace 事件`);
  const file = path.join(OUT_DIR, `real-${key}.json`);
  fs.writeFileSync(file, JSON.stringify({ traceEvents: events }), "utf8");
  console.log("已保存:", file);

  // ---------- 快速汇总 ----------
  const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
  const agg = new Map();
  for (const e of xs) {
    if (e.dur < 200) continue;
    const cur = agg.get(e.name) || { dur: 0, count: 0 };
    cur.dur += e.dur;
    cur.count++;
    agg.set(e.name, cur);
  }
  console.log("\n=== 总耗时排行 top 18 ===");
  [...agg.entries()]
    .sort((a, b) => b[1].dur - a[1].dur)
    .slice(0, 18)
    .forEach(([n, v]) =>
      console.log(`${(v.dur / 1000).toFixed(1).padStart(9)}ms ${String(v.count).padStart(6)}次 ${n}`)
    );

  const longTasks = xs.filter((e) => e.dur > 50000).sort((a, b) => b.dur - a.dur);
  console.log(`\n=== 长任务(>50ms): ${longTasks.length} 个 ===`);
  longTasks.slice(0, 8).forEach((e) => console.log(`  ${(e.dur / 1000).toFixed(1)}ms  ${e.name}`));
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
