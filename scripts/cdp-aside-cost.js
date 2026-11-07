/**
 * 侧栏（aside + header）到底给拖拽带来多少负担 —— 逐项拆解。
 *
 * 已知：隐藏 aside+header 后 p99 从 23 降到 16.5；隐藏全部卡片几乎无变化。
 * 说明负担在侧栏/顶栏一侧。本脚本把侧栏拆成几层分别隐藏后拖拽对照：
 *   1. 基线
 *   2. 只隐藏菜单项里的图标（.menu-icon）
 *   3. 只隐藏菜单文字（.menu-ellipsis）
 *   4. 只隐藏顶栏
 *   5. 隐藏整个侧栏
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

  const counts = await page.evaluate(() => ({
    menuItems: document.querySelectorAll(".el-menu-item").length,
    menuIcons: document.querySelectorAll(".menu-icon").length,
    svgIcons: document.querySelectorAll(".el-aside svg").length,
    asideNodes: document.querySelectorAll(".el-aside *").length,
    headerNodes: document.querySelectorAll(".el-header *").length,
    bodyNodes: document.body.querySelectorAll("*").length,
  }));
  console.log("=== 节点规模 ===");
  console.log(JSON.stringify(counts, null, 1));

  async function drag(label, css, undo) {
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
      `  ${label.padEnd(26)} p50=${String(p(0.5)).padStart(6)} p95=${String(p(0.95)).padStart(6)} p99=${String(p(0.99)).padStart(6)} max=${String(g[g.length - 1]).padStart(6)} >16.7=${g.filter((x) => x > 16.7).length}`
    );
    if (undo) await page.addStyleTag({ content: undo });
  }

  await page.click(".aw__add", { force: true });
  await sec(2000);
  await page.waitForSelector(".el-dialog", { timeout: 10000 });

  console.log("\n=== 侧栏/顶栏逐层拆解 ===");
  await drag("0 基线");
  await drag("1 隐藏菜单图标", `.menu-icon,.el-menu-item svg{display:none!important}`, `.menu-icon,.el-menu-item svg{display:revert!important}`);
  await drag("2 隐藏菜单文字", `.menu-ellipsis{display:none!important}`, `.menu-ellipsis{display:revert!important}`);
  await drag("3 隐藏顶栏", `.el-header{display:none!important}`, `.el-header{display:revert!important}`);
  await drag("4 隐藏整个侧栏", `.el-aside{display:none!important}`, `.el-aside{display:revert!important}`);
  await drag("5 隐藏侧栏+顶栏", `.el-aside,.el-header{display:none!important}`, `.el-aside,.el-header{display:revert!important}`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
