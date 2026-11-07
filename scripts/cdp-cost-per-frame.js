/**
 * 拖拽卡顿的最终定量归因：把「每帧固定做的事」全部列出来，量化每一项的耗时。
 *
 * 已确认的事实：
 *   - 每次 mousemove 都触发 Element Plus 的 useDraggable.adjustPosition：
 *       getBoundingClientRect() + documentElement.clientWidth/clientHeight + 写 transform
 *   - 每帧随后发生一次「元素=6」的样式重算（119 次 / 121 次移动）
 *   - 打开弹窗时额外有 2 次「元素=100」（el-scrollbar onUpdated 强制布局）
 *
 * 本脚本直接在线测量：把弹窗的 getBoundingClientRect 包起来计时，
 * 以及用 Performance.mark 在 mousemove 首尾打点，得出「拖拽每帧花在布局上的净时间」。
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

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();

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

  // 量：adjustPosition 里 GBCR + clientWidth 的净耗时
  const r = await page.evaluate(async () => {
    const dlg = document.querySelector(".el-dialog");
    const orig = Element.prototype.getBoundingClientRect;
    let n = 0;
    let total = 0;
    let max = 0;
    Element.prototype.getBoundingClientRect = function () {
      const t = performance.now();
      const res = orig.call(this);
      const d = performance.now() - t;
      if (this === dlg) {
        n++;
        total += d;
        max = Math.max(max, d);
      }
      return res;
    };

    // 模拟拖拽循环：每帧 GBCR + clientWidth + 写 transform
    const frames = [];
    let cw = 0;
    let ch = 0;
    await new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        const t0 = performance.now();
        const rect = dlg.getBoundingClientRect();
        cw = document.documentElement.clientWidth;
        ch = document.documentElement.clientHeight;
        dlg.style.transform = `translate(${i}px, ${Math.round(Math.sin(i * 0.1) * 8)}px)`;
        frames.push(+(performance.now() - t0).toFixed(3));
        if (++i < 120) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    Element.prototype.getBoundingClientRect = orig;

    const s = [...frames].sort((a, b) => a - b);
    return {
      gbcrCalls: n,
      gbcrTotalMs: +total.toFixed(1),
      gbcrMaxMs: +max.toFixed(3),
      frameSync: { p50: s[Math.floor(s.length * 0.5)], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1] },
      viewport: cw + "x" + ch,
    };
  });

  console.log("\n=== 模拟拖拽 120 帧（GBCR + 读视口 + 写 transform）===");
  console.log(JSON.stringify(r, null, 1));

  // 对照：同样循环但不读 GBCR / 视口
  const r2 = await page.evaluate(async () => {
    const dlg = document.querySelector(".el-dialog");
    const frames = [];
    await new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        const t0 = performance.now();
        dlg.style.transform = `translate(${i}px, ${Math.round(Math.sin(i * 0.1) * 8)}px)`;
        frames.push(+(performance.now() - t0).toFixed(3));
        if (++i < 120) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const s = [...frames].sort((a, b) => a - b);
    return { p50: s[Math.floor(s.length * 0.5)], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1] };
  });
  console.log("\n=== 对照：只写 transform，不读布局 ===");
  console.log(JSON.stringify(r2, null, 1));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
