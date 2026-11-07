/**
 * 真实 monitor 页面上的最终验证：
 *   拖拽真实闹钟弹窗，对比「原样」与「把 transition 时长归零」两种状态下的样式重算次数。
 *
 * 注入方式：page.addStyleTag，只影响当前页面，不改仓库文件。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "latencyInfo", "benchmark", "v8.execute", "cc", "gpu", "blink", "toplevel"].join(",");

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

  async function round(label, x0, y0, prepare) {
    if (prepare) await prepare();
    await sec(500);
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(700);

    await page.mouse.move(x0, y0);
    await sec(120);
    await page.mouse.down();
    await sec(80);
    const t = Date.now();
    for (let i = 1; i <= 150; i++) {
      await page.mouse.move(x0 + i * 1.8, y0 + Math.sin(i * 0.15) * 9);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
    await sec(500);

    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    await sec(300);

    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const paint = xs.filter((e) => e.name === "Paint");
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    const paintMs = +(paint.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    const perMove = mm.length ? +(ms / mm.length).toFixed(3) : 0;
    const r = { label, moves: mm.length, ult: ult.length, ms, paint: paint.length, paintMs, perMove };
    console.log(
      `${label.padEnd(30)} moves=${String(r.moves).padStart(3)}  重算=${String(r.ult).padStart(4)}次/${String(ms + "ms").padStart(8)}  每次移动=${perMove}ms  Paint=${paint.length}次/${paintMs}ms`
    );
    return r;
  }

  const R = [];

  // A 原样拖弹窗
  await page.click(".aw__add", { force: true });
  await sec(1800);
  let h = await page.locator(".el-dialog__header").first().boundingBox();
  R.push(await round("A 原样（拖弹窗）", h.x + 60, h.y + h.height / 2));

  // B 原样但鼠标扫侧边栏（不拖）
  R.push(await round("B 原样（扫侧边栏）", 30, 200));

  // C duration 归零后再扫侧边栏
  R.push(
    await round(
      "C duration:0s（扫侧边栏）",
      30,
      200,
      async () => {
        await page.addStyleTag({ content: `*,*::before,*::after{transition-duration:0s!important}` });
      }
    )
  );

  // D duration 归零后再拖弹窗
  h = await page.locator(".el-dialog__header").first().boundingBox();
  R.push(await round("D duration:0s（拖弹窗）", h.x + 60, h.y + h.height / 2));

  console.log("\n==================== 真实页面汇总 ====================");
  console.log("场景                          重算次数   重算耗时   每次移动");
  R.forEach((r) => console.log(`${r.label.padEnd(28)} ${String(r.ult).padStart(6)} ${String(r.ms + "ms").padStart(10)} ${String(r.perMove + "ms").padStart(10)}`));
  if (R.length >= 4) {
    console.log(`\n扫侧边栏：${R[1].ult} -> ${R[2].ult} 次（${Math.round(((R[2].ult - R[1].ult) / R[1].ult) * 100)}%）`);
    console.log(`拖弹窗  ：${R[0].ult} -> ${R[3].ult} 次（${Math.round(((R[3].ult - R[0].ult) / R[0].ult) * 100)}%）`);
  }

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
