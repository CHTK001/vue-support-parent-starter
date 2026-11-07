/**
 * 用页面内自驱的高频 mousemove 压测（绕开 CDP 往返瓶颈）。
 *
 * Playwright 的 mouse.move 每次都要一次 CDP 往返，实际只能到 20-40fps，
 * 压力不够，所以一直测不出卡顿。这里直接在页面里用 rAF 驱动派发
 * 可信度足够的 MouseEvent，每帧多次，模拟真人快速拖拽。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

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

  /**
   * 页面内压测：rAF 里每帧派发 K 次 mousemove，持续 durationMs。
   * 统计 rAF 间隔分位 + 每帧实际派发次数 + 单帧耗时。
   */
  async function stressDrag(label, k = 8, durationMs = 2500) {
    const res = await page.evaluate(
      async ([k, durationMs]) => {
        const dlg = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
        if (!dlg) return { error: "no dialog" };
        const header = dlg.querySelector(".el-dialog__header");
        const h = header.getBoundingClientRect();
        const startX = h.x + 80;
        const startY = h.y + h.height / 2;

        const gaps = [];
        const frameCost = [];
        let last = 0;
        let t0 = 0;
        let dispatched = 0;
        let frames = 0;
        const longTasks = [];
        try {
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) longTasks.push(e.duration);
          }).observe({ entryTypes: ["longtask"] });
        } catch {}

        return await new Promise((resolve) => {
          let i = 0;
          const step = (t) => {
            if (!t0) t0 = t;
            if (last) gaps.push(t - last);
            last = t;
            frames++;

            const frameStart = performance.now();
            // 本帧内派发 K 次 mousemove
            for (let j = 0; j < k; j++) {
              i++;
              const ev = new MouseEvent("mousemove", {
                clientX: startX + i * 0.8,
                clientY: startY + Math.sin(i * 0.05) * 12,
                bubbles: true,
                cancelable: true,
                view: window,
              });
              document.dispatchEvent(ev);
              dispatched++;
            }
            frameCost.push(performance.now() - frameStart);

            if (t - t0 < durationMs) requestAnimationFrame(step);
            else {
              const g = gaps.slice().sort((a, b) => a - b);
              const q = (p) => (g.length ? g[Math.min(g.length - 1, Math.floor(g.length * p))] : 0);
              const avg = g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
              const fc = frameCost.slice().sort((a, b) => a - b);
              const fq = (p) => (fc.length ? fc[Math.min(fc.length - 1, Math.floor(fc.length * p))] : 0);
              const transform = dlg.style.transform;
              resolve({
                frames,
                dispatched,
                fps: avg > 0 ? +(1000 / avg).toFixed(1) : 0,
                p50: +q(0.5).toFixed(2),
                p95: +q(0.95).toFixed(2),
                p99: +q(0.99).toFixed(2),
                max: g.length ? +g[g.length - 1].toFixed(2) : 0,
                over33: g.filter((x) => x > 33.4).length,
                over50: g.filter((x) => x > 50).length,
                // 单帧内派发 K 次事件的耗时（真实压力指标）
                costP50: +fq(0.5).toFixed(2),
                costP95: +fq(0.95).toFixed(2),
                costP99: +fq(0.99).toFixed(2),
                costMax: fc.length ? +fc[fc.length - 1].toFixed(2) : 0,
                longTasks: longTasks.length,
                longTaskMs: +longTasks.reduce((a, b) => a + b, 0).toFixed(1),
                transform,
              });
            }
          };

          // 先派发 mousedown 让 useDraggable 进入拖拽态
          const down = new MouseEvent("mousedown", {
            clientX: startX,
            clientY: startY,
            bubbles: true,
            cancelable: true,
            buttons: 1,
            view: window,
          });
          header.dispatchEvent(down);
          setTimeout(() => requestAnimationFrame(step), 60);
        });
      },
      [k, durationMs]
    );

    if (res.error) {
      console.log(`【${label}】${res.error}`);
      return res;
    }
    console.log(`\n【${label}】每帧派发 ${k} 次 mousemove`);
    console.log(`  实际派发=${res.dispatched} 帧数=${res.frames} fps=${res.fps}`);
    console.log(`  帧间隔: p50=${res.p50} p95=${res.p95} p99=${res.p99} max=${res.max}ms  超33ms=${res.over33} 超50ms=${res.over50}`);
    console.log(`  单帧派发耗时: p50=${res.costP50} p95=${res.costP95} p99=${res.costP99} max=${res.costMax}ms`);
    console.log(`  长任务=${res.longTasks}个/${res.longTaskMs}ms`);
    console.log(`  transform=${res.transform}`);
    return res;
  }

  // ===== ReDialog =====
  await page.click(".dlg-fps__btn--primary");
  await sec(1500);
  const reCls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log("\n① ReDialog:", reCls);
  const re = await stressDrag("ReDialog 高压拖拽", 8, 2500);

  // 复位
  await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    if (d) d.style.transform = "";
  });
  await sec(800);

  await page.keyboard.press("Escape");
  await sec(1500);

  // ===== ElDialog =====
  await page.click(".dlg-fps__btn:not(.dlg-fps__btn--primary)");
  await sec(1500);
  const elCls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log("\n② ElDialog:", elCls);
  const el = await stressDrag("ElDialog 高压拖拽", 8, 2500);

  console.log("\n\n==================== 高压对比（每帧 8 次 mousemove） ====================");
  console.log("场景         fps   帧间隔p95  帧间隔max  单帧耗时p95  单帧耗时max  长任务");
  const line = (n, r) =>
    `${n.padEnd(10)}  ${String(r.fps).padStart(5)} ${String(r.p95).padStart(9)} ${String(r.max).padStart(10)} ${String(r.costP95).padStart(11)} ${String(r.costMax).padStart(11)}  ${r.longTasks}个/${r.longTaskMs}ms`;
  if (!re.error) console.log(line("ReDialog", re));
  if (!el.error) console.log(line("ElDialog", el));

  await sec(1000);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
