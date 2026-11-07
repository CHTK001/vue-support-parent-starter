/**
 * 拖拽期间每帧的「同步布局」是从哪来的 —— 对齐 trace 与页面时间轴。
 *
 * 已知：
 *   - 拖拽 120 帧 = 197 次 UpdateLayoutTree，其中 119 次是「元素=6」
 *   - 元素=100 的两次栈顶是 Element Plus el-scrollbar → update() 读 offsetHeight
 *   - 弹窗自身 0 个 scrollbar，全页只有 2 个
 *
 * 本脚本在拖拽期间：
 *   1. 用长任务 API + 自定义计时量「每帧 JS 总时长」
 *   2. 用 monkey patch 量 getComputedStyle / getBoundingClientRect / offsetHeight 的调用方
 *   3. 输出每次调用的函数名（从 Error().stack 取）
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

  // 安装探针：读布局的 API 全部包一层，记录调用方
  await page.evaluate(() => {
    const stats = { gbcr: {}, cs: {}, oh: {}, byFrame: [] };

    const who = () => {
      const st = new Error().stack || "";
      const lines = st.split("\n").slice(2, 5);
      for (const l of lines) {
        const m = l.match(/at\s+([^\s(]+)?\s*\(?([^)]*?)\)?$/);
        if (!m) continue;
        const fn = m[1] || "(anon)";
        if (/^(Object\.|Element\.|<anonymous>|Function\.)/.test(fn)) continue;
        const url = m[2] || "";
        const file = url.split("/").slice(-1)[0].split("?")[0];
        if (!file || /cdp-/.test(file)) continue;
        return `${fn} @ ${file}`;
      }
      return "(unknown)";
    };

    const wrap = (obj, name, key, bucket) => {
      const orig = obj[name];
      obj[name] = function (...args) {
        const k = who();
        bucket[k] = (bucket[k] || 0) + 1;
        return orig.apply(this, args);
      };
    };

    wrap(Element.prototype, "getBoundingClientRect", "gbcr", stats.gbcr);
    const origCS = window.getComputedStyle;
    window.getComputedStyle = function (...a) {
      const k = who();
      stats.cs[k] = (stats.cs[k] || 0) + 1;
      return origCS.apply(this, a);
    };
    const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        const k = who();
        stats.oh[k] = (stats.oh[k] || 0) + 1;
        return d.get.call(this);
      },
    });

    window.__stats = stats;
    window.__stopStats = () => stats;
    return true;
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
  await sec(300);

  const stats = await page.evaluate(() => window.__stopStats());
  const show = (title, obj, limit = 10) => {
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limit);
    const total = Object.values(obj).reduce((a, b) => a + b, 0);
    console.log(`\n=== ${title}（共 ${total} 次）===`);
    entries.forEach(([k, v]) => console.log(`  ${String(v).padStart(5)} 次  ${k}`));
  };
  show("getBoundingClientRect 调用方", stats.gbcr);
  show("getComputedStyle 调用方", stats.cs);
  show("offsetHeight 调用方", stats.oh);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
