/**
 * 逐个隐藏首页 widget，找出拖拽时拖慢帧率的那一个。
 *
 * 上下文：整个首页 2574 个节点；只隐藏 .home-grid 就能让 p99 从 23 降到 16.2。
 * 说明负担集中在卡片区。这里按 widget 类型逐个隐藏对照。
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

  // 列出每个卡片
  const cards = await page.evaluate(() => {
    return [...document.querySelectorAll(".vgl-item")].map((el, i) => {
      const r = el.getBoundingClientRect();
      const w = el.querySelector(".widget-renderer");
      const inner = w ? w.firstElementChild : null;
      return {
        i,
        cls: inner ? inner.className.split(" ").slice(0, 3).join(".") : "(空)",
        nodes: el.querySelectorAll("*").length,
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
  });
  console.log("=== 首页卡片 ===");
  cards.forEach((c) => console.log(`  #${c.i} ${c.cls.padEnd(40)} 节点=${String(c.nodes).padStart(4)}  位置=${c.x},${c.y} 尺寸=${c.w}x${c.h}`));

  async function drag(label, css) {
    if (css) await page.addStyleTag({ content: css });
    await sec(450);
    await page.evaluate(() => {
      window.__f = [];
      const tick = (t) => {
        window.__f.push(t);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const h = await page.locator(".el-dialog__header").first().boundingBox();
    const x0 = h.x + 40;
    const y0 = h.y + h.height / 2;
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
    await sec(120);
    const f = await page.evaluate(() => window.__f);
    const g = f.slice(1).map((v, i) => +(v - f[i]).toFixed(2)).filter((x) => x > 0).sort((a, b) => a - b);
    const p = (q) => g[Math.floor(g.length * q)] ?? 0;
    console.log(
      `  ${label.padEnd(24)} p50=${String(p(0.5)).padStart(6)} p95=${String(p(0.95)).padStart(6)} p99=${String(p(0.99)).padStart(6)} max=${String(g[g.length - 1]).padStart(6)}`
    );
  }

  await page.click(".aw__add", { force: true });
  await sec(2000);
  await page.waitForSelector(".el-dialog", { timeout: 10000 });

  console.log("\n=== 逐个隐藏卡片后拖拽 ===");
  await drag("0 全部显示");
  for (const c of cards) {
    await drag(`隐藏 #${c.i} ${c.cls.split(".")[0].slice(0, 12)}`, `.vgl-item:nth-child(${c.i + 1}){display:none!important}`);
    await page.addStyleTag({ content: `.vgl-item:nth-child(${c.i + 1}){display:revert!important}` });
  }
  await drag("隐藏全部卡片", `.home-grid{display:none!important}`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
