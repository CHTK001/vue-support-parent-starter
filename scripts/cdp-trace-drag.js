/**
 * 用 CDP Tracing 抓拖拽过程的完整性能轨迹（等价于 DevTools Performance 面板录制）。
 *
 * 输出：
 *   D:\ch\.trace\drag-trace.json   原始 trace
 *   控制台打印：主线程耗时 top 排行 + 长任务明细 + 每类事件总耗时
 *
 * 用法：
 *   node scripts/cdp-trace-drag.js             # 测 ReDialog
 *   node scripts/cdp-trace-drag.js --el        # 测 ElDialog
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const USE_EL = process.argv.includes("--el");
const OUT_DIR = "D:\\ch\\.trace";

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

  // ---------- 打开弹窗 ----------
  if (USE_EL) {
    await page.click(".dlg-fps__btn:not(.dlg-fps__btn--primary)");
  } else {
    await page.click(".dlg-fps__btn--primary");
  }
  await sec(2000);

  const label = USE_EL ? "ElDialog" : "ReDialog";
  const cls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log(`弹窗: ${label}  class=${cls}`);

  // ---------- 开始录制 ----------
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

  await sec(1200); // 采集一段静态
  console.log("开始拖拽…");

  // 真实鼠标拖拽（CDP 路径，最接近人工）
  const h = await page.locator(".el-dialog__header").first().boundingBox();
  const sx2 = h.x + 80;
  const y2 = h.y + h.height / 2;
  await page.mouse.move(sx2, y2);
  await sec(150);
  await page.mouse.down();
  await sec(100);
  const tStart = Date.now();
  for (let i = 1; i <= 260; i++) {
    await page.mouse.move(sx2 + i * 2, y2 + Math.sin(i * 0.15) * 14);
    const w = tStart + i * 8 - Date.now();
    if (w > 0) await sec(w);
  }
  await page.mouse.up();
  await sec(800);

  const tracingDone = new Promise((resolve) => {
    cdp.once("Tracing.tracingComplete", resolve);
  });
  await cdp.send("Tracing.end");
  console.log("录制结束，等待 trace 传输…");
  await tracingDone;

  await sec(500);
  await browser.close();

  // ---------- 分析 trace ----------
  console.log(`\n收到 ${events.length} 个 trace 事件`);

  const file = path.join(OUT_DIR, `drag-trace-${USE_EL ? "el" : "re"}.json`);
  fs.writeFileSync(file, JSON.stringify({ traceEvents: events }), "utf8");
  console.log("已保存:", file);

  // 主线程 X 事件（完整事件，ph = X）
  const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");

  // 1) 长任务：> 50ms
  const longTasks = xs.filter((e) => e.dur > 50000).sort((a, b) => b.dur - a.dur);
  console.log(`\n=== 长任务（>50ms）: ${longTasks.length} 个 ===`);
  longTasks.slice(0, 10).forEach((e) => {
    console.log(`  ${(e.dur / 1000).toFixed(1)}ms  ${e.name}  [${e.cat}]`);
  });

  // 2) 按 name 聚合总耗时
  const agg = new Map();
  for (const e of xs) {
    if (e.dur < 200) continue; // 忽略极短
    const cur = agg.get(e.name) || { dur: 0, count: 0 };
    cur.dur += e.dur;
    cur.count++;
    agg.set(e.name, cur);
  }
  const top = [...agg.entries()].sort((a, b) => b[1].dur - a[1].dur).slice(0, 25);
  console.log("\n=== 耗时排行（总耗时 > 200µs 的事件，按总耗时） ===");
  console.log("总耗时(ms)  次数    平均(ms)  事件名");
  top.forEach(([name, v]) => {
    console.log(
      `${(v.dur / 1000).toFixed(1).padStart(10)}  ${String(v.count).padStart(6)}  ${(v.dur / v.count / 1000).toFixed(2).padStart(8)}  ${name}`
    );
  });

  // 3) 关键渲染指标
  const counts = (name) => xs.filter((e) => e.name === name).length;
  const sumDur = (name) => xs.filter((e) => e.name === name).reduce((a, e) => a + e.dur, 0) / 1000;
  console.log("\n=== 渲染管线关键项 ===");
  [
    "Layout",
    "RecalculateStyles",
    "UpdateLayoutTree",
    "Paint",
    "CompositeLayers",
    "UpdateLayer",
    "UpdateLayerTree",
    "PrePaint",
    "PaintImage",
    "RasterTask",
    "ImageDecodeTask",
    "FunctionCall",
    "EventDispatch",
    "TimerFire",
    "FireAnimationFrame",
    "FireIdleCallback",
    "RunMicrotasks",
    "v8.run",
    "HandleInputEvent",
  ].forEach((n) => {
    const c = counts(n);
    if (c) console.log(`  ${n.padEnd(22)} ${String(c).padStart(6)} 次   合计 ${sumDur(n).toFixed(1)} ms`);
  });

  // 4) Frames（rAF 回调）
  console.log("\n=== 前 20 个最慢的 FunctionCall / Layout ===");
  const slow = xs
    .filter((e) => ["FunctionCall", "Layout", "UpdateLayoutTree", "Paint", "EventDispatch"].includes(e.name))
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 20);
  slow.forEach((e) => {
    let extra = "";
    if (e.args && e.args.data) {
      const d = e.args.data;
      if (d.functionName) extra = ` fn=${d.functionName}`;
      else if (d.type) extra = ` type=${d.type}`;
      else if (d.url) extra = ` url=${String(d.url).slice(-60)}`;
    }
    console.log(`  ${(e.dur / 1000).toFixed(2)}ms  ${e.name}${extra}`);
  });
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
