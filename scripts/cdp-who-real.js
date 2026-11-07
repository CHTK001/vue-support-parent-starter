/**
 * 真实 monitor 页面上「谁在触发样式重算」的定位脚本。
 *
 * 已知：
 *   - 静态复刻页上 transition 是主因（170 -> 15）；
 *   - 真实页面上把 transition-duration 归零后重算次数没降（196 -> 266）。
 *
 * 所以真实页面还有别的标脏源。这里把 UpdateLayoutTree 的 trace 明细摊开：
 *   每次重算的元素数（args.elementCount）、重算前后紧邻的事件、
 *   耗时 >1ms 的调用栈（args.beginData.stackTrace）。
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const OUT = "D:\\ch\\.trace";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const CATS = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.stack",
  "blink.user_timing",
  "latencyInfo",
  "benchmark",
  "v8.execute",
  "cc",
  "gpu",
  "blink",
  "toplevel",
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
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

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
  console.log("首页就绪");

  // 打开真实业务弹窗
  await page.click(".aw__add", { force: true });
  await sec(1800);
  await page.addStyleTag({ content: `*,*::before,*::after{transition-duration:0s!important}` });
  await sec(600);
  const tNow = await page.evaluate(() => getComputedStyle(document.querySelector(".el-menu-item")).transition);
  console.log("注入后 .el-menu-item transition =", tNow);

  const events = [];
  cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
  await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
  await sec(700);

  // 扫侧栏（不拖弹窗）
  const t = Date.now();
  await page.mouse.move(30, 200);
  for (let i = 1; i <= 150; i++) {
    await page.mouse.move(30 + (i % 60) * 1.5, 200 + Math.sin(i * 0.2) * 60 + (i % 40) * 8);
    const w = t + i * 8 - Date.now();
    if (w > 0) await sec(w);
  }
  await sec(500);
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  await done;
  await sec(300);

  // 按时间排序（ReportEvents 的 B/E 是区间，X 是完整事件）
  const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
  const ult = xs.filter((e) => e.name === "UpdateLayoutTree").sort((a, b) => a.ts - b.ts);
  const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");

  console.log(`\nmoves=${mm.length}  UpdateLayoutTree=${ult.length}`);

  // 1. elementCount 分布
  const byCount = new Map();
  let totalElems = 0;
  for (const e of ult) {
    const c = e.args?.elementCount ?? -1;
    totalElems += c > 0 ? c : 0;
    byCount.set(c, (byCount.get(c) || 0) + 1);
  }
  console.log("\n--- 重算元素数分布（elementCount: 次数）---");
  [...byCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([c, n]) => console.log(`  ${c} 个元素 -> ${n} 次`));
  console.log(`  合计元素 ${totalElems}，平均 ${(totalElems / ult.length).toFixed(2)} 个/次`);

  // 2. 耗时最长 5 次的调用栈
  const slow = [...ult].sort((a, b) => b.dur - a.dur).slice(0, 5);
  console.log("\n--- 耗时最长的 5 次重算 ---");
  slow.forEach((e, i) => {
    const st = e.args?.beginData?.stackTrace;
    const frames = st ? st.map((f) => `${f.functionName || "(anon)"} @ ${(f.url || "").split("/").slice(-2).join("/")}:${f.lineNumber}`) : [];
    console.log(`  #${i + 1} ${(e.dur / 1000).toFixed(2)}ms  元素=${e.args?.elementCount ?? "?"}  原因=${e.args?.beginData?.dirtyObjects ?? "?"}`);
    frames.slice(0, 4).forEach((f) => console.log(`       ${f}`));
  });

  // 3. 每次 UpdateLayoutTree 前 6ms 内发生了什么（找标脏源）
  const names = new Map();
  for (const e of ult) {
    const near = xs.filter((x) => x !== e && x.ts <= e.ts && x.ts > e.ts - 6000);
    const key = near
      .map((x) => x.name)
      .filter((n) => !["UpdateLayoutTree", "Paint", "Commit", "RasterTask", "TimerFire", "FunctionCall", "v8.callFunction"].includes(n))
      .slice(-3)
      .join(" > ") || "(无)";
    names.set(key, (names.get(key) || 0) + 1);
  }
  console.log("\n--- 重算前 6ms 内的近邻事件 TOP ---");
  [...names.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .forEach(([k, n]) => console.log(`  ${String(n).padStart(4)} 次  ${k}`));

  // 4. 落盘完整 trace 供 DevTools 打开
  fs.mkdirSync(OUT, { recursive: true });
  const file = `${OUT}\\who-invalidates-real.json`;
  fs.writeFileSync(file, JSON.stringify({ traceEvents: events }), "utf8");
  console.log(`\ntrace 已保存: ${file}  (${Math.round(fs.statSync(file).size / 1048576)}MB)`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
