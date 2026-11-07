/**
 * 逐级二分：找到「让拖拽帧间隔从 13.4 掉到接近 16.7」的那一个东西。
 *
 * 已排除：
 *   - 登录页静止帧间隔 13.3ms（环境本身没问题）
 *   - 拖拽期间 JS 几乎不花时间（setProperty 0 次、longtask 0 次）
 *   - 关掉所有 transition 后重算次数不变
 *   - 拖拽期间 DOM 变更的 105 次 childList 是「打开弹窗」时的一次性插入
 *
 * 本脚本在真实页面上逐级做减法，看帧间隔有没有变化：
 *   1. 基线拖拽
 *   2. 隐藏首页卡片区（只剩空壳）
 *   3. 隐藏侧栏和顶栏
 *   4. 关闭弹窗拖拽（对照）
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

  async function drag(label, css) {
    if (css) await page.addStyleTag({ content: css });
    await sec(500);
    await page.evaluate(() => {
      window.__f = [];
      window.__m = [];
      const tick = (t) => {
        window.__f.push(t);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.addEventListener("mousemove", () => window.__m.push(performance.now()), true);
    });
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
    await sec(150);
    const { f, m } = await page.evaluate(() => ({ f: window.__f, m: window.__m }));
    const g = f.slice(1).map((v, i) => +(v - f[i]).toFixed(2)).sort((a, b) => a - b);
    const p = (q) => g[Math.floor(g.length * q)] ?? 0;
    const over167 = g.filter((x) => x > 16.7).length;
    console.log(
      `  ${label.padEnd(26)} 帧=${String(f.length).padStart(3)} 移动=${String(m.length).padStart(3)} p50=${String(p(0.5)).padStart(6)} p95=${String(p(0.95)).padStart(6)} p99=${String(p(0.99)).padStart(6)} max=${String(g[g.length - 1]).padStart(6)} >16.7ms=${over167}`
    );
  }

  console.log("\n=== 逐级二分（拖拽 120 次）===");
  await page.click(".aw__add", { force: true });
  await sec(2000);
  await page.waitForSelector(".el-dialog", { timeout: 10000 });

  await drag("1 基线（全页面）");
  await drag("2 隐藏首页卡片", `.home-grid,.home-card{display:none!important}`);
  await drag("3 再隐藏侧栏+顶栏", `.el-aside,.el-header{display:none!important}`);
  await drag("4 只留弹窗", `.el-main{display:none!important}`);

  await page.addStyleTag({ content: `.home-grid,.home-card,.el-aside,.el-header,.el-main{display:revert!important}` });
  await sec(400);
  await page.keyboard.press("Escape");
  await sec(600);
  await drag("5 关弹窗后空移", "");

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
