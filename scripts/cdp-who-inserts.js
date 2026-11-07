/**
 * 定位「拖拽时每帧往 body 里插/删节点」的元凶。
 *
 * 上一轮：拖拽 120 帧期间，body 直属 div 有 105 次 childList 变更；
 * 同时 kw-hour / kw-week / kw-metric 的 svg 在不断重渲染（21+7+3）。
 * 这些是「首页小组件仍在刷新」的迹象 —— 弹窗开着时小组件并没停。
 *
 * 本脚本：
 *   1. 记录 childList 变更时被插入/删除的节点的完整描述
 *   2. 记录每次变更的时间戳，看是否与「小组件刷新间隔」对齐
 *   3. 关掉小组件自动刷新后再拖，看重算是否下降
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

  // 先看首页上有没有什么在按固定间隔刷新（不开弹窗）
  await page.evaluate(() => {
    const ev = [];
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type !== "childList" || !m.addedNodes.length) continue;
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          ev.push({ t: performance.now(), node: n.tagName.toLowerCase() + (n.className && typeof n.className === "string" ? "." + n.className.split(" ").slice(0, 2).join(".") : "") });
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.__ins = ev;
    window.__insStop = () => {
      mo.disconnect();
      return ev;
    };
  });

  await sec(6000);
  const idle = await page.evaluate(() => window.__insStop());
  // 按节点归组 + 算时间间隔
  const byNode = {};
  for (const e of idle) {
    (byNode[e.node] = byNode[e.node] || []).push(e.t);
  }
  console.log("\n=== 首页空闲 6 秒内的节点插入（不开弹窗）===");
  Object.entries(byNode)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([k, ts]) => {
      const gaps = ts.slice(1).map((t, i) => Math.round(t - ts[i]));
      console.log(`  ${String(ts.length).padStart(4)} 次  ${k.padEnd(50)} 间隔=${gaps.slice(0, 6).join(",")}ms`);
    });

  // 打开弹窗后再测一次
  await page.evaluate(() => {
    const ev = [];
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type !== "childList" || !m.addedNodes.length) continue;
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          ev.push({ t: performance.now(), node: n.tagName.toLowerCase() + (n.className && typeof n.className === "string" ? "." + n.className.split(" ").slice(0, 2).join(".") : ""), parent: m.target.tagName.toLowerCase() + (m.target.className && typeof m.target.className === "string" ? "." + m.target.className.split(" ").slice(0, 2).join(".") : "") });
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.__ins2 = ev;
    window.__insStop2 = () => {
      mo.disconnect();
      return ev;
    };
  });

  await page.click(".aw__add", { force: true });
  await sec(2000);
  await page.waitForSelector(".el-dialog", { timeout: 10000 });
  await sec(6000);

  const withDlg = await page.evaluate(() => window.__insStop2());
  const by2 = {};
  for (const e of withDlg) {
    const k = `${e.node} <- ${e.parent}`;
    (by2[k] = by2[k] || []).push(e.t);
  }
  console.log("\n=== 弹窗打开后 6 秒内的节点插入 ===");
  Object.entries(by2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([k, ts]) => {
      const gaps = ts.slice(1).map((t, i) => Math.round(t - ts[i]));
      console.log(`  ${String(ts.length).padStart(4)} 次  ${k.padEnd(60)} 间隔=${gaps.slice(0, 8).join(",")}ms`);
    });

  console.log(`\n空闲 ${idle.length} 次 / 弹窗期 ${withDlg.length} 次`);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
