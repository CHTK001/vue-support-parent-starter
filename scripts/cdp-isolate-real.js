/**
 * 在真实 monitor 页面上做「谁被标脏」的逐层排查。
 *
 * 上一轮结论：150 次鼠标移动 = 155 次重算，每次恒定 4 个元素、0.7ms。
 * 4 个元素说明不是整页重算，而是少数几个元素（很可能是 :hover 状态切换）。
 *
 * 本脚本用 CDP DOMDebugger 的思路不可行，改用「逐层隐藏再测」：
 *   1. 只扫侧栏
 *   2. 隐藏侧栏（display:none）后扫同一区域
 *   3. 隐藏 header
 *   4. 隐藏主内容区
 * 哪一层藏起来后重算归零，脏源就在那一层。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "blink", "toplevel", "benchmark"].join(",");

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

  // 冷启动（--force 重建依赖缓存后）首屏要 30s 左右才挂载，给足时间
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
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(7000);
  console.log("首页就绪");

  // 页面结构快照：鼠标扫过的那片区域里到底有哪些元素
  const layout = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return [
      pick(".el-aside"),
      pick(".el-header"),
      pick(".el-main"),
      pick(".layout"),
      pick("#app > div"),
    ].filter(Boolean);
  });
  console.log("布局区域:", JSON.stringify(layout));

  async function measure(label) {
    await sec(400);
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(500);
    const t = Date.now();
    await page.mouse.move(30, 200);
    for (let i = 1; i <= 150; i++) {
      await page.mouse.move(30 + (i % 60) * 1.5, 200 + Math.sin(i * 0.2) * 60 + (i % 40) * 8);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await sec(400);
    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    await sec(250);
    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const counts = new Map();
    for (const e of ult) {
      const c = e.args?.elementCount ?? -1;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    console.log(
      `${label.padEnd(26)} moves=${String(mm.length).padStart(3)} 重算=${String(ult.length).padStart(4)}次/${String(ms + "ms").padStart(8)}  元素数分布=${JSON.stringify(
        [...counts.entries()].slice(0, 5)
      )}`
    );
    return { label, moves: mm.length, ult: ult.length, ms };
  }

  const R = [];
  R.push(await measure("0 基线（无注入）"));

  await page.addStyleTag({ content: `.el-aside{display:none!important}` });
  R.push(await measure("1 隐藏侧栏"));

  await page.addStyleTag({ content: `.el-aside{display:block!important}.el-header{display:none!important}` });
  R.push(await measure("2 恢复侧栏/隐藏 header"));

  await page.addStyleTag({ content: `.el-header{display:block!important}.el-main{display:none!important}` });
  R.push(await measure("3 恢复 header/隐藏主区"));

  await page.addStyleTag({ content: `.el-main{display:block!important}.el-aside{display:none!important}.el-header{display:none!important}` });
  R.push(await measure("4 只留主内容区"));

  await page.addStyleTag({ content: `.el-aside{display:block!important}.el-header{display:block!important}` });
  // 鼠标扫侧栏那一片时，指针下到底是什么元素
  const hit = await page.evaluate(async () => {
    const pts = [[30, 200], [30, 260], [60, 320], [90, 380], [120, 440]];
    return pts.map(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return `${x},${y} -> null`;
      const cs = getComputedStyle(el);
      return `${x},${y} -> ${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0, 3).join(".")}  transition=${cs.transitionDuration}`;
    });
  });
  console.log("\n鼠标扫过位置下的元素:");
  hit.forEach((h) => console.log("  " + h));

  console.log("\n==================== 汇总 ====================");
  R.forEach((r) => console.log(`${r.label.padEnd(24)} ${String(r.ult).padStart(5)} 次 / ${r.ms}ms`));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
