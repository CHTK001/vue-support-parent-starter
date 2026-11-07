/**
 * 每帧 3 次样式重算的元凶定位。
 *
 * 关键观察：关掉所有 transition 后重算次数不变（373 vs 374），
 * 且 121 次移动 = 373 次重算，正好 3 次/帧 —— 这不是 hover 驱动的，
 * 而是有个东西在**每帧主动写样式**。
 *
 * 本脚本：记录拖拽期间所有 DOM 属性变更，按「元素 + 属性 + 值模板」聚合，
 * 直接看出是谁在每帧改什么。
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

  // 全文档级 MutationObserver：谁在改，改什么
  await page.evaluate(() => {
    const agg = {};
    const pathOf = (el) => {
      const p = [];
      let n = el;
      let d = 0;
      while (n && d < 5) {
        const cls = typeof n.className === "string" && n.className ? "." + n.className.split(/\s+/).slice(0, 2).join(".") : "";
        p.push(n.tagName.toLowerCase() + cls);
        n = n.parentElement;
        d++;
      }
      return p.join(" < ");
    };
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        const key = `${pathOf(m.target)} | ${m.type === "attributes" ? m.attributeName : m.type}`;
        agg[key] = (agg[key] || 0) + 1;
      }
    });
    mo.observe(document.body, { attributes: true, subtree: true, childList: true, characterData: true });
    window.__magg = agg;
    window.__mstop = () => {
      mo.disconnect();
      return agg;
    };
  });

  // 拖拽
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

  const agg = await page.evaluate(() => window.__mstop());
  console.log("\n=== 拖拽 120 次期间，全文档 DOM 变更来源 TOP 20 ===");
  Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([k, v]) => console.log(`  ${String(v).padStart(5)} 次  ${k}`));

  const total = Object.values(agg).reduce((a, b) => a + b, 0);
  console.log(`\n  合计 ${total} 次变更`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
