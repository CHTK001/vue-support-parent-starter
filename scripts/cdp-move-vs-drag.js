/**
 * 决定性对照：鼠标移动本身是否就在触发全文档样式重算。
 *
 * 四个分支，各 150 步、相同的移动轨迹与节奏：
 *   A. 弹窗开着，鼠标在弹窗标题栏上拖（mousedown + move）
 *   B. 弹窗开着，鼠标在空白处空移（不按下）
 *   C. 弹窗关闭，鼠标在同样位置空移
 *   D. 弹窗开着，鼠标完全不动（只是等待同样时长）—— 基线
 *
 * 输出每个分支的：mousemove 派发数、UpdateLayoutTree 次数与耗时、单次移动代价
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

const CATS = [
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
].join(",");

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized"],
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

  async function traceRound(label, fn) {
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(700);
    await fn();
    await sec(500);
    const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    await done;
    await sec(300);
    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const styleTime = xs.filter((e) => e.name === "Blink.Style.UpdateTime");
    const r = {
      label,
      mousemoves: mm.length,
      ult: ult.length,
      ultMs: +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1),
      styleMs: +(styleTime.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1),
      perMove: mm.length ? +((ult.reduce((a, e) => a + e.dur, 0) / 1000) / mm.length).toFixed(3) : 0,
    };
    console.log(
      `【${label}】mousemove=${r.mousemoves}  样式重算=${r.ult}次/${r.ultMs}ms  每次移动代价=${r.perMove}ms`
    );
    return r;
  }

  /** 150 步移动，可选按住左键 */
  async function sweep(x0, y0, hold, n = 150) {
    await page.mouse.move(x0, y0);
    await sec(120);
    if (hold) {
      await page.mouse.down();
      await sec(80);
    }
    const t = Date.now();
    for (let i = 1; i <= n; i++) {
      await page.mouse.move(x0 + i * 1.8, y0 + Math.sin(i * 0.15) * 9);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    if (hold) await page.mouse.up();
  }

  const results = [];

  // ---------- A 拖拽 ----------
  await page.click(".aw__add", { force: true });
  await sec(1800);
  const hb = await page.locator(".el-dialog__header").first().boundingBox();
  results.push(await traceRound("A 弹窗开着 · 拖拽", () => sweep(hb.x + 60, hb.y + hb.height / 2, true)));

  // ---------- B 弹窗开着 · 空移（不按键）----------
  // 移到弹窗外的页面空白区（左下角）
  results.push(await traceRound("B 弹窗开着 · 空移", () => sweep(120, 700, false)));

  await page.keyboard.press("Escape");
  await sec(1800);

  // ---------- C 弹窗关着 · 空移 ----------
  results.push(await traceRound("C 弹窗关闭 · 空移", () => sweep(120, 700, false)));

  // ---------- D 完全不动 ----------
  results.push(
    await traceRound("D 完全不动（基线）", async () => {
      await sec(150 * 8);
    })
  );

  console.log("\n==================== 汇总 ====================");
  console.log("分支                     mousemove   样式重算次数   重算耗时   每次移动代价");
  results.forEach((r) => {
    console.log(
      `${r.label.padEnd(24)} ${String(r.mousemoves).padStart(9)} ${String(r.ult).padStart(12)} ${String(r.ultMs + "ms").padStart(10)} ${String(r.perMove + "ms").padStart(13)}`
    );
  });

  await sec(500);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
