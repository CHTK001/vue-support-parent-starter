/**
 * 定位 ReDialog 卡顿来源：对比不同拖拽抓取点。
 *
 * 假设：koi 壳标题栏右侧有 3 个操作按钮（最小化/全屏/关闭），
 * 带 transition: all + :active{transform:scale}。从按钮区域起拖会触发
 * 额外合成层与过渡，导致拖拽发涩。
 *
 * 验证：同一弹窗，分别从
 *   A. 标题文字左侧（远离按钮）
 *   B. 按钮区域内（close 按钮中心）
 * 起拖，比较每帧耗时与帧间隔分位。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = () => {
  const P = { gaps: [], longTasks: [], frames: 0, last: 0 };
  window.__D = P;
  const raf = (t) => {
    if (P.last) P.gaps.push(t - P.last);
    P.last = t;
    P.frames++;
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) P.longTasks.push(e.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {}
  P.reset = () => {
    P.gaps = [];
    P.longTasks = [];
    P.frames = 0;
    P.last = 0;
  };
  P.stop = () => {
    const g = P.gaps.slice().sort((a, b) => a - b);
    const q = (p) => (g.length ? g[Math.min(g.length - 1, Math.floor(g.length * p))] : 0);
    const avg = g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
    return {
      frames: P.frames,
      fps: avg > 0 ? +(1000 / avg).toFixed(1) : 0,
      p50: +q(0.5).toFixed(2),
      p95: +q(0.95).toFixed(2),
      p99: +q(0.99).toFixed(2),
      max: g.length ? +g[g.length - 1].toFixed(2) : 0,
      over33: g.filter((x) => x > 33.4).length,
      longTasks: P.longTasks.length,
      longTaskMs: +P.longTasks.reduce((a, b) => a + b, 0).toFixed(1),
    };
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

  // 打开 ReDialog
  await page.click(".dlg-fps__btn--primary");
  await sec(1500);

  // 看标题栏里有什么
  const headerInfo = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    if (!d) return null;
    const header = d.querySelector(".el-dialog__header");
    const btns = [...header.querySelectorAll("button, .koi-toolbar-btn")].map((b) => {
      const r = b.getBoundingClientRect();
      return { cls: b.className, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const hr = header.getBoundingClientRect();
    return {
      header: { x: Math.round(hr.x), y: Math.round(hr.y), w: Math.round(hr.width), h: Math.round(hr.height) },
      buttons: btns,
      customHeader: !!header.querySelector(".koi-dialog-custom-header"),
    };
  });
  console.log("标题栏结构:", JSON.stringify(headerInfo, null, 2));

  async function dragFrom(px, py, label) {
    await page.evaluate(() => window.__D.reset());
    await page.mouse.move(px, py);
    await sec(80);
    await page.mouse.down();
    await sec(60);
    for (let i = 1; i <= 400; i++) {
      await page.mouse.move(px + i * 1.2, py + Math.sin(i * 0.12) * 10);
      await sec(4);
    }
    await page.mouse.up();
    await sec(600);
    const r = await page.evaluate(() => window.__D.stop());
    console.log(
      `【${label}】fps=${r.fps} p50=${r.p50} p95=${r.p95} p99=${r.p99} max=${r.max} 超33ms=${r.over33} 长任务=${r.longTasks}/${r.longTaskMs}ms`
    );
    return r;
  }

  const results = {};

  if (headerInfo) {
    const h = headerInfo.header;
    // A: 标题文字处（左侧，远离按钮）
    results.from_title = await dragFrom(h.x + 60, h.y + h.h / 2, "A 从标题文字起拖");

    // 把弹窗拖回原位
    await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      if (d) d.style.transform = "";
    });
    await sec(500);

    // B: 从按钮区域起拖
    if (headerInfo.buttons.length) {
      const b = headerInfo.buttons[headerInfo.buttons.length - 1];
      results.from_button = await dragFrom(b.x + b.w / 2, b.y + b.h / 2, "B 从标题栏按钮起拖");
    }
  }

  console.log("\n==================== 结论 ====================");
  if (results.from_title && results.from_button) {
    const t = results.from_title;
    const b = results.from_button;
    console.log(`从标题起拖 : p95=${t.p95}  p99=${t.p99}  max=${t.max}  超33=${t.over33}`);
    console.log(`从按钮起拖 : p95=${b.p95}  p99=${b.p99}  max=${b.max}  超33=${b.over33}`);
    console.log(`差异       : p95 ${(b.p95 - t.p95).toFixed(2)}ms  max ${(b.max - t.max).toFixed(2)}ms`);
  }

  await sec(1000);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
