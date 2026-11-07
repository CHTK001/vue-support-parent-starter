/**
 * 定位「元素=6」那 119 次重算到底是谁触发的。
 *
 * 已确认 adjustPosition（Element Plus 拖拽）每次 mousemove 都：
 *   - getBoundingClientRect()   ← 120 次
 *   - document.documentElement.clientWidth/clientHeight  ← 又一次强制布局
 *   - 写 style.transform
 * 但拖拽本身不改尺寸，所以问题在别处：每帧还有 1 次「元素=6」的样式重算。
 *
 * 本脚本同时记录：
 *   1. 每帧 mousemove 的 clientWidth 读取次数（强制布局）
 *   2. el-tooltip / el-select 在拖拽期间的 sr-only 探测节点变更
 *   3. 直接对比：把 tooltip 全部禁用后再拖
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

  // 量：拖拽期间 clientWidth / clientHeight 读取次数
  await page.evaluate(() => {
    const stat = { cw: 0, ch: 0 };
    const de = document.documentElement.constructor.prototype;
    ["clientWidth", "clientHeight"].forEach((k) => {
      const d = Object.getOwnPropertyDescriptor(Element.prototype, k);
      if (!d) return;
      Object.defineProperty(Element.prototype, k, {
        configurable: true,
        get() {
          if (this === document.documentElement) stat[k === "clientWidth" ? "cw" : "ch"]++;
          return d.get.call(this);
        },
      });
    });
    window.__stat = stat;
  });

  async function round(label) {
    const events = [];
    const onData = (e) => events.push(...e.value);
    cdp.on("Tracing.dataCollected", onData);
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(350);

    const h = await page.locator(".el-dialog__header").first().boundingBox();
    const x0 = h.x + 40;
    const y0 = h.y + h.height / 2;
    await page.evaluate(() => {
      window.__stat.cw = 0;
      window.__stat.ch = 0;
    });
    await page.mouse.move(x0, y0);
    await sec(70);
    await page.mouse.down();
    await sec(50);
    const t = Date.now();
    for (let i = 1; i <= 120; i++) {
      await page.mouse.move(x0 + i * 1.5, y0 + Math.sin(i * 0.1) * 8);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
    await sec(250);

    const st = await page.evaluate(() => window.__stat);
    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    cdp.off("Tracing.dataCollected", onData);
    await sec(150);

    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const dist = ult.reduce((a, e) => {
      const k = e.args?.elementCount ?? -1;
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {});
    console.log(
      `  ${label.padEnd(26)} 移动=${String(mm.length).padStart(3)} 重算=${String(ult.length).padStart(4)}  元素数=${JSON.stringify(dist)}  读视口=${st.cw}/${st.ch}`
    );
  }

  console.log("\n=== 每帧的视口读取与重算 ===");
  await round("0 基线");
  await page.addStyleTag({ content: `.el-tooltip__trigger{pointer-events:none!important}` });
  await sec(300);
  await round("1 关掉 tooltip 命中");
  await page.addStyleTag({ content: `.el-tooltip__trigger{pointer-events:revert!important}` });
  await round("2 恢复");

  // 弹窗移到屏幕中央再拖（避免贴边 clamp 分支）
  await page.evaluate(() => {
    const d = document.querySelector(".el-dialog");
    d.style.transform = "translate(0px, 0px)";
  });
  await sec(300);
  await round("3 弹窗归零后拖");

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
