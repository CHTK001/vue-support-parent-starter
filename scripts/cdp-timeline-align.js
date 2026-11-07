/**
 * 时间轴对齐：把「鼠标移动 / 样式重算 / 绘制」按时间排在一行，看它们到底怎么咬合。
 *
 * 前几轮数据有矛盾：
 *   - 拖拽期间 DOM 变更 369 次，看着很多
 *   - 但弹窗打开后 6 秒只有 9 次节点插入，README 静态
 *   - 关掉所有 transition 后重算次数不变
 * 说明这些"变更"绝大多数是 120 帧拖拽本身产生的（每帧 1 次 diallog style +
 * 首页小组件的重渲染），不是持续后台活动。
 *
 * 本脚本输出一张时间轴，回答：
 *   1. 每帧重算几次，分别花了多久
 *   2. 重算是不是发生在 mousemove 之后的同一帧内
 *   3. 有没有"帧做完还要补齐"的额外重算
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

  await page.evaluate(() => {
    window.__ev = [];
    window.addEventListener("mousemove", (e) => window.__ev.push({ t: performance.now(), type: "move", x: Math.round(e.clientX) }), true);
    window.__frames = [];
    const tick = (t) => {
      window.__frames.push(t);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

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
  await sec(400);

  const { ev, frames } = await page.evaluate(() => ({ ev: window.__ev, frames: window.__frames }));
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  await done;
  cdp.off("Tracing.dataCollected", onData);
  await sec(200);

  const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
  const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
  const paint = xs.filter((e) => e.name === "Paint");

  // trace 的 ts 是微秒、相对进程启动；页面 performance.now 是毫秒相对导航。
  // 用一个锚点对齐：取第一帧的时间。
  const t0 = frames[0];
  const ultRel = ult.map((e) => ({ ms: e.ts / 1000, dur: e.dur / 1000, elems: e.args?.elementCount ?? -1 }));

  console.log("\n=== 时间轴（页面帧序号 / 该帧内移动次数 / 重算次数 / 重算耗时 / 元素数）===");
  console.log("  帧  移动  重算  耗时ms  元素数");
  // 把重算按页面帧分桶
  const moveByFrame = new Map();
  for (const m of ev) {
    // 找它落在哪个帧
    let idx = 0;
    for (let i = 0; i < frames.length; i++) {
      if (frames[i] <= m.t) idx = i;
      else break;
    }
    moveByFrame.set(idx, (moveByFrame.get(idx) || 0) + 1);
  }
  // 用重算事件与帧的相对位置近似分桶（trace 时间与 performance 时间对齐靠帧间隔分布，不精确，
  // 因此这里按「每帧的重算条数」统计总量而不是逐帧精确对齐）
  const perFrame = ult.length / frames.length;
  console.log(`  总帧数 ${frames.length}，总移动 ${ev.length}，总重算 ${ult.length}，平均 ${perFrame.toFixed(2)} 重算/帧`);
  console.log(`  重算元素数分布: ` + JSON.stringify(ultRel.reduce((a, o) => { a[o.elems] = (a[o.elems] || 0) + 1; return a; }, {})));
  console.log(`  Paint ${paint.length} 次`);

  // 帧间隔
  const gaps = frames.slice(1).map((f, i) => +(f - frames[i]).toFixed(2));
  const s = [...gaps].sort((a, b) => a - b);
  console.log(`\n  帧间隔 p50=${s[Math.floor(s.length * 0.5)]} p95=${s[Math.floor(s.length * 0.95)]} max=${s[s.length - 1]}`);
  console.log(`  >16.7ms: ${gaps.filter((g) => g > 16.7).length} 次   >20ms: ${gaps.filter((g) => g > 20).length} 次`);

  // 相邻两次移动的间隔
  const mg = ev.slice(1).map((e, i) => +(e.t - ev[i].t).toFixed(2)).sort((a, b) => a - b);
  console.log(`  移动间隔 p50=${mg[Math.floor(mg.length * 0.5)]} p95=${mg[Math.floor(mg.length * 0.95)]} max=${mg[mg.length - 1]}`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
