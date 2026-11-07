/**
 * 在真实 monitor 页面做同一套排查（需要后端 8082 在线）。
 * 关闭/开启 侧边栏 hover 效果，对比拖拽时样式重算次数。
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

  /** 统计页面里 hover 规则与 transition 元素数量 */
  const cssStats = await page.evaluate(() => {
    let hoverRules = 0;
    let transEls = 0;
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list) => {
        for (const r of list) {
          if (r.selectorText && /:hover/.test(r.selectorText)) hoverRules++;
          if (r.cssRules) walk(r.cssRules);
        }
      };
      walk(rules);
    }
    for (const el of document.querySelectorAll("*")) {
      const t = getComputedStyle(el).transitionProperty;
      if (t && t !== "none") transEls++;
    }
    return { hoverRules, transEls, nodes: document.querySelectorAll("*").length };
  });
  console.log("页面 CSS 特征:", JSON.stringify(cssStats));

  async function round(label, prepare) {
    if (prepare) await prepare();
    await sec(400);
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(600);

    const h = await page.locator(".el-dialog__header").first().boundingBox();
    const x0 = h.x + 60;
    const y0 = h.y + h.height / 2;
    await page.mouse.move(x0, y0);
    await sec(120);
    await page.mouse.down();
    await sec(80);
    const t = Date.now();
    for (let i = 1; i <= 150; i++) {
      await page.mouse.move(x0 + i * 1.8, y0 + Math.sin(i * 0.15) * 9);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
    await sec(400);

    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    await sec(250);

    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const os = xs.filter((e) => e.name === "UpdateLayoutTree");
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    console.log(`${label.padEnd(34)} moves=${String(mm.length).padStart(3)}  样式重算=${String(ult.length).padStart(4)}次 ${String(ms + "ms").padStart(8)}`);
    return { label, moves: mm.length, ult: ult.length, ms };
  }

  await page.click(".aw__add", { force: true });
  await sec(1800);

  const R = [];
  R.push(await round("A 基线（原样）"));

  // B 关掉所有 transition
  R.push(
    await round(
      "B 关掉全部 transition",
      async () => {
        await page.addStyleTag({
          content: `*, *::before, *::after { transition: none !important; animation: none !important; }`,
        });
      }
    )
  );

  await sec(300);
  // C 在 B 基础上再关掉 :hover 悬停态（把 hover 规则覆盖成 no-op 不易做，改为禁用 pointer-events 于侧栏）
  R.push(
    await round(
      "C 再关掉侧边栏 hover",
      async () => {
        await page.addStyleTag({
          content: `.layout-group-aside *, .el-aside * { pointer-events: none !important; }`,
        });
      }
    )
  );

  console.log("\n==================== 汇总 ====================");
  R.forEach((r) => console.log(`${r.label.padEnd(28)} ${String(r.ult).padStart(5)} 次 / ${r.ms}ms`));
  if (R.length >= 3) console.log(`\n关 transition 后减少 ${R[0].ult - R[1].ult} 次；再关 hover 后减少 ${R[1].ult - R[2].ult} 次`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
