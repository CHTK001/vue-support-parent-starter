/**
 * 真实浏览器里诊断 ReDialog 卡顿。
 *
 * 与之前测 fps 不同：这里测「每帧耗时」，因为卡顿可能表现为
 * 每帧处理时间长、但帧率没掉（rAF 被拉长后仍能凑够 75）。
 *
 * 采集三组：
 *   A. rAF 帧间隔（含长任务分位：p50 / p95 / p99 / max）
 *   B. LongTask API（>50ms 的任务数）
 *   C. 拖拽时 el-dialog 的 transform 写入次数 vs rAF 帧数（是否一帧写多次）
 *   D. 强制重排次数（Performance.getMetrics LayoutCount）
 *
 * 对比：ReDialog（koi 壳）vs ElDialog（原生）
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = () => {
  const P = {
    gaps: [],        // 相邻 rAF 间隔
    longTasks: [],   // LongTask 时长
    tfWrites: 0,     // transform 写入次数
    frames: 0,
    running: false,
    last: 0,
  };
  window.__D = P;

  const raf = (t) => {
    if (P.running && P.last) P.gaps.push(t - P.last);
    P.last = t;
    P.frames++;
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) P.longTasks.push(e.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {}

  P.reset = () => {
    P.gaps = [];
    P.longTasks = [];
    P.tfWrites = 0;
    P.frames = 0;
    P.last = 0;
    P.running = true;
  };
  P.stop = () => {
    P.running = false;
    const g = P.gaps.slice().sort((a, b) => a - b);
    const q = (p) => (g.length ? g[Math.min(g.length - 1, Math.floor(g.length * p))] : 0);
    const avg = g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
    return {
      frames: P.frames,
      gaps: g.length,
      avgGap: +avg.toFixed(2),
      fps: avg > 0 ? +(1000 / avg).toFixed(1) : 0,
      p50: +q(0.5).toFixed(2),
      p95: +q(0.95).toFixed(2),
      p99: +q(0.99).toFixed(2),
      max: g.length ? +g[g.length - 1].toFixed(2) : 0,
      over33: g.filter((x) => x > 33.4).length,
      over50: g.filter((x) => x > 50).length,
      longTasks: P.longTasks.length,
      longTaskMs: +P.longTasks.reduce((a, b) => a + b, 0).toFixed(1),
      maxLongTask: P.longTasks.length ? +Math.max(...P.longTasks).toFixed(1) : 0,
      tfWrites: P.tfWrites,
    };
  };

  // 统计 transform 写入：劫持 style 的 transform setter
  P.hookTransform = (el) => {
    if (!el || el.__hooked) return false;
    el.__hooked = true;
    const orig = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, "transform");
    return true;
  };
};

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();

  // 让鼠标移动尽可能密集，模拟真人快速拖拽
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
  await sec(5000);
  console.log("首页就绪");

  await page.evaluate(PROBE);

  /** 测量一段：拖拽或滚动 */
  async function measure(kind, label) {
    await page.evaluate(() => window.__D.reset());
    const t0 = Date.now();

    if (kind === "drag") {
      const h = await page.locator(".el-dialog__header").first().boundingBox();
      const sx = h.x + 60;
      const y = h.y + h.height / 2;
      await page.mouse.move(sx, y);
      await page.mouse.down();
      // 高密度移动：每 4ms 一次，远超 60fps，压出真实的每帧耗时
      for (let i = 1; i <= 400; i++) {
        await page.mouse.move(sx + i * 1.2, y + Math.sin(i * 0.12) * 10);
        await sec(4);
      }
      await page.mouse.up();
    } else {
      await page.evaluate(() => {
        const body = [...document.querySelectorAll(".el-dialog__body, .dialog-content-wrapper")].find(
          (b) => b.offsetParent !== null && b.scrollHeight > b.clientHeight
        );
        if (!body) return;
        body.scrollTop = 0;
        const t = performance.now();
        const step = () => {
          if (performance.now() - t > 2000) return;
          body.scrollTop += 12;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }

    await sec(2200);
    const r = await page.evaluate(() => window.__D.stop());
    r.elapsedMs = Date.now() - t0;
    console.log(`\n【${label}】`);
    console.log(`  帧数=${r.frames}  fps=${r.fps}  平均间隔=${r.avgGap}ms`);
    console.log(`  帧间隔分位: p50=${r.p50}  p95=${r.p95}  p99=${r.p99}  max=${r.max}ms`);
    console.log(`  超33ms=${r.over33}  超50ms=${r.over50}  长任务=${r.longTasks}个 / ${r.longTaskMs}ms (最大 ${r.maxLongTask}ms)`);
    return r;
  }

  const results = {};

  // ===== ① ReDialog =====
  await page.click(".dlg-fps__btn--primary");
  await sec(1500);
  const reCls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log("\n① ReDialog:", reCls);
  results.re_drag = await measure("drag", "ReDialog 拖拽");

  // 看 ReDialog 里到底有几个滚动容器
  const scrollHosts = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    if (!d) return [];
    return [...d.querySelectorAll("*")]
      .filter((e) => {
        const cs = getComputedStyle(e);
        return /auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2;
      })
      .map((e) => ({
        cls: e.className,
        scrollH: e.scrollHeight,
        clientH: e.clientHeight,
        overflowY: getComputedStyle(e).overflowY,
      }));
  });
  console.log("  ReDialog 内可滚动容器:", JSON.stringify(scrollHosts, null, 2));

  results.re_scroll = await measure("scroll", "ReDialog 滚动");

  await page.keyboard.press("Escape");
  await sec(1500);

  // ===== ② ElDialog =====
  await page.click(".dlg-fps__btn:not(.dlg-fps__btn--primary)");
  await sec(1500);
  const elCls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log("\n② ElDialog:", elCls);
  results.el_drag = await measure("drag", "ElDialog 拖拽");
  results.el_scroll = await measure("scroll", "ElDialog 滚动");

  console.log("\n\n==================== 对比 ====================");
  console.log("场景            fps   p50    p95     p99     max     超33ms  长任务");
  const line = (n, r) =>
    `${n.padEnd(14)}  ${String(r.fps).padStart(5)} ${String(r.p50).padStart(6)} ${String(r.p95).padStart(6)} ${String(r.p99).padStart(6)} ${String(r.max).padStart(7)}  ${String(r.over33).padStart(6)}  ${r.longTasks}个/${r.longTaskMs}ms`;
  console.log(line("ReDialog 拖拽", results.re_drag));
  console.log(line("ReDialog 滚动", results.re_scroll));
  console.log(line("ElDialog 拖拽", results.el_drag));
  console.log(line("ElDialog 滚动", results.el_scroll));

  await sec(1000);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
