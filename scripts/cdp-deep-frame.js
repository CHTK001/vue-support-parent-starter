/**
 * 深度定卡：拖真实业务弹窗时，主线程到底被谁吃掉。
 *
 * 上一轮只统计了 UpdateLayoutTree。但"不流畅"可能是别的东西：
 *   - 长任务 / 长动画帧（AnimationFrame::Fire 单帧 > 16.7ms）
 *   - 帧与帧之间的间隔（rAF 间隔 p95 / max）
 *   - JS 执行（FunctionCall / EvaluateScript）里的长尾
 *   - 合成器线程的主线程等待（Commit / 光栅）
 *
 * 本脚本一次采一段 trace，然后从多个角度拆：
 *   1. 帧间隔：每帧实际渲染时刻的间隔分布
 *   2. 主线程上耗时 TOP10 的事件名（按总耗时）
 *   3. 单次最长 10 个主线程任务及其调用栈
 *   4. mousemove 事件处理函数自身的耗时分布
 *   5. 样式重算 / 布局 / 绘制 / 合成 四类计数
 *
 * 用法：node scripts/cdp-deep-frame.js [--no-fix]
 *   --no-fix 先不注入修复，量当前页面原样
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const OUT = "D:\\ch\\.trace";
const NOFIX = process.argv.includes("--no-fix");
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
// 只开需要的最小类别：全开 cc+gpu+blink 会把 trace 撑到几百 MB，
// 在本机（可用内存不到 10GB）会直接把 node 顶成 OOM。
const CATS = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "disabled-by-default-devtools.timeline.stack",
  "blink.user_timing",
  "latencyInfo",
  "v8.execute",
  "blink",
].join(",");

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
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  // 冷启动可能 30~60s
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

  // 打开真实业务弹窗（闹钟）
  await page.click(".aw__add", { force: true });
  await sec(2000);
  await page.waitForSelector(".el-dialog", { timeout: 10000 });
  console.log("弹窗已打开");

  if (!NOFIX) {
    console.log("（当前页面使用仓库里已改过的 CSS）");
  }

  // 在页面里记录 rAF 时间戳，用于精确的帧间隔
  await page.evaluate(() => {
    window.__fr = [];
    const tick = (t) => {
      window.__fr.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
  await sec(600);

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
  await sec(600);

  const fr = await page.evaluate(() => window.__fr);
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  await done;
  await sec(300);

  // ---------- 1. 帧间隔（页面自己的 rAF） ----------
  const gaps = [];
  for (let i = 1; i < fr.length; i++) gaps.push(fr[i] - fr[i - 1]);
  const sorted = [...gaps].sort((a, b) => a - b);
  const pct = (p) => sorted[Math.floor(sorted.length * p)] ?? 0;
  const over = (ms) => gaps.filter((g) => g > ms).length;
  console.log("\n========== 1. 帧间隔（页面 rAF，ms）==========");
  console.log(`  帧数=${gaps.length}  平均=${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2)}`);
  console.log(`  p50=${pct(0.5).toFixed(2)}  p95=${pct(0.95).toFixed(2)}  p99=${pct(0.99).toFixed(2)}  max=${sorted[sorted.length - 1].toFixed(2)}`);
  console.log(`  >20ms=${over(20)} 次   >33ms=${over(33)} 次   >50ms=${over(50)} 次   >100ms=${over(100)} 次`);
  const longFrames = gaps.map((g, i) => ({ g, t: fr[i] })).filter((o) => o.g > 20).sort((a, b) => b.g - a.g).slice(0, 8);
  if (longFrames.length) {
    console.log("  最长的 8 帧: " + longFrames.map((o) => o.g.toFixed(1)).join(", "));
  }

  // ---------- 2. 主线程事件耗时 TOP ----------
  const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number" && e.dur > 0);
  const byName = new Map();
  for (const e of xs) {
    const k = e.name;
    const cur = byName.get(k) || { n: 0, ms: 0, max: 0 };
    cur.n++;
    cur.ms += e.dur / 1000;
    cur.max = Math.max(cur.max, e.dur / 1000);
    byName.set(k, cur);
  }
  console.log("\n========== 2. 事件总耗时 TOP 15 ==========");
  console.log("  事件名".padEnd(46) + "次数".padStart(6) + "总ms".padStart(10) + "最长ms".padStart(10));
  [...byName.entries()]
    .sort((a, b) => b[1].ms - a[1].ms)
    .slice(0, 15)
    .forEach(([k, v]) => {
      console.log("  " + k.padEnd(44) + String(v.n).padStart(6) + v.ms.toFixed(1).padStart(10) + v.max.toFixed(2).padStart(10));
    });

  // ---------- 3. 单次最长的主线程任务 + 调用栈 ----------
  const interesting = xs.filter((e) =>
    ["FunctionCall", "EvaluateScript", "EventDispatch", "UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Commit", "AnimationFrame::Fire", "TimerFire", "ParseHTML", "RecalculateStyles"].includes(e.name)
  );
  const worst = [...interesting].sort((a, b) => b.dur - a.dur).slice(0, 10);
  console.log("\n========== 3. 单次最长的 10 个事件 ==========");
  worst.forEach((e, i) => {
    const st = e.args?.beginData?.stackTrace || e.args?.data?.stackTrace;
    const top = st && st[0] ? `${st[0].functionName || "(anon)"} @ ${(st[0].url || "").split("/").slice(-2).join("/")}:${st[0].lineNumber}` : "-";
    const extra = e.args?.elementCount !== undefined ? ` 元素=${e.args.elementCount}` : "";
    console.log(`  #${i + 1} ${(e.dur / 1000).toFixed(2)}ms  ${e.name}${extra}`);
    if (top !== "-") console.log(`        ${top}`);
  });

  // ---------- 4. mousemove 处理耗时 ----------
  const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
  const mmd = mm.map((e) => e.dur / 1000).sort((a, b) => a - b);
  console.log("\n========== 4. mousemove 分发耗时 ==========");
  if (mmd.length) {
    console.log(
      `  次数=${mmd.length}  p50=${(mmd[Math.floor(mmd.length * 0.5)] || 0).toFixed(3)}ms  p95=${(mmd[Math.floor(mmd.length * 0.95)] || 0).toFixed(3)}ms  max=${mmd[mmd.length - 1].toFixed(3)}ms  总=${mmd.reduce((a, b) => a + b, 0).toFixed(1)}ms`
    );
  } else console.log("  （无）");

  // ---------- 5. 四类计数 ----------
  const cnt = (n) => xs.filter((e) => e.name === n);
  console.log("\n========== 5. 渲染管线计数 ==========");
  [
    ["UpdateLayoutTree", "样式重算"],
    ["Layout", "布局"],
    ["PrePaint", "预绘"],
    ["Paint", "绘制"],
    ["Commit", "提交"],
  ].forEach(([n, label]) => {
    const a = cnt(n);
    console.log(`  ${label.padEnd(6)} ${String(a.length).padStart(5)} 次 / ${a.reduce((s, e) => s + e.dur, 0).toFixed(1)}ms`);
  });

  fs.mkdirSync(OUT, { recursive: true });
  const file = `${OUT}\\deep-frame-${NOFIX ? "now" : "fixed"}.json`;
  fs.writeFileSync(file, JSON.stringify({ traceEvents: events }), "utf8");
  console.log(`\ntrace 已保存: ${file} (${Math.round(fs.statSync(file).size / 1048576)}MB)`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
