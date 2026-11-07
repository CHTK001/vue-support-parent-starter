/**
 * ReDialog vs 裸 el-dialog：拖拽 / 内部滚动 的帧率对比。
 *
 * 两个弹窗内部内容完全一致（200 行占位，超出高度出滚动条），
 * 只有外壳不同：
 *   A. ReDialog（.re-dialog，KOI 主题壳 + el-dialog 原生 draggable）
 *   B. 裸 el-dialog（element-plus 默认样式，同样原生 draggable）
 *
 * 每个弹窗各测三段：
 *   1. 静态空闲（2s）
 *   2. 拖拽 header（90 次 mousemove，~60fps）
 *   3. 内部滚动条持续滚动（el-scrollbar 滚轮 + 滚动容器 scrllTop 动画）
 *
 * fps 用页面内 rAF 计数；同时用 CDP Performance.getMetrics 记录布局/合成开销。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

function installProbe() {
  const P = { frames: [], movesAt: [] };
  const raf = () => {
    P.frames.push(performance.now());
    if (P.frames.length > 60000) P.frames.splice(0, 30000);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  document.addEventListener("mousemove", () => P.movesAt.push(performance.now()), true);
  window.__P = P;
  window.__snap = (t0, t1) => {
    const inR = (a) => a.filter((x) => x >= t0 && x <= t1);
    const f = inR(P.frames);
    const m = inR(P.movesAt);
    const d = t1 - t0;
    return {
      frames: f.length,
      ms: Math.round(d),
      fps: d > 0 ? Math.round((f.length / d) * 10000) / 10 : 0,
      moves: m.length,
      // 帧间隔抖动：最大帧间隔 / 平均帧间隔
      maxGap: (() => {
        if (f.length < 2) return 0;
        let mx = 0;
        for (let i = 1; i < f.length; i++) mx = Math.max(mx, f[i] - f[i - 1]);
        return Math.round(mx * 10) / 10;
      })(),
    };
  };
  window.__clearP = () => {
    P.frames.length = 0;
    P.movesAt.length = 0;
  };
}

async function metrics(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const g = (n) => metrics.find((m) => m.name === n)?.value ?? 0;
  return {
    LayoutCount: g("LayoutCount"),
    RecalcStyleCount: g("RecalcStyleCount"),
    LayoutDuration: g("LayoutDuration"),
    RecalcStyleDuration: g("RecalcStyleDuration"),
    TaskDuration: g("TaskDuration"),
  };
}
const KEYS = ["LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration", "TaskDuration"];
function dif(a, b) {
  const o = {};
  for (const k of KEYS) o[k] = Math.round((b[k] - a[k]) * 100000) / 100000;
  return o;
}

/** 在页面里造一个和 ReDialog 内容等长的填充内容 */
function makeFillBody() {
  const host = document.createElement("div");
  host.id = "probe-fill";
  host.style.cssText = "padding:8px 16px 8px 16px;";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 200; i++) {
    const row = document.createElement("div");
    row.textContent = `填充行 ${i + 1} —— 用于撑出内部滚动条，测量滚动帧率`;
    row.style.cssText =
      "height:28px;line-height:28px;border-bottom:1px solid rgba(0,0,0,.06);font-size:13px;white-space:nowrap;";
    frag.appendChild(row);
  }
  host.appendChild(frag);
  return host;
}

/** 让内层滚动容器滚起来：持续改 scrollTop（比滚轮更稳定、可控） */
function startAutoScroll(containerSel, durationMs) {
  const el = document.querySelector(containerSel);
  if (!el) return { ok: false, reason: "no container " + containerSel };
  const P = window.__P;
  P.scrollFrames = 0;
  const start = performance.now();
  let dir = 1;
  let last = performance.now();
  let frames = 0;
  // 用 rAF 驱动，每帧滚 8px，到顶/到底折返
  const step = () => {
    const now = performance.now();
    if (now - start > durationMs) {
      window.__scrollFrames = frames;
      return;
    }
    const before = el.scrollTop;
    el.scrollTop = before + dir * 8;
    if (el.scrollTop === before) dir = -dir;
    frames++;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  window.__scrollFrames = 0;
  return { ok: true };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
    args: ["--no-sandbox", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");

  try {
    // ---------- 登录 ----------
    await page.goto(TARGET, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".login-form", { timeout: 30000 });
    await page.waitForSelector(".loading-box", { state: "detached", timeout: 30000 }).catch(() => {});
    await sec(800);

    const inputs = page.locator(".login-input .el-input__inner");
    await inputs.first().fill("admin");
    await inputs.nth(1).fill("admin123");
    await sec(200);
    await page.click(".login-btn", { force: true });

    const track = await page.waitForSelector(".slider-verify-track", { timeout: 10000 }).catch(() => null);
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

    await page.waitForURL((u) => !/login/.test(u.pathname), { timeout: 45000 });
    await page.waitForSelector(".home-card", { timeout: 60000 });
    console.log("home loaded");
    await sec(5000);

    // ---------- 进入编辑 + 打开 ReDialog ----------
    await page.waitForSelector(".home-layout-toolbar__btn", { state: "visible", timeout: 30000 });
    await page.click(".home-layout-toolbar__btn", { force: true });
    await sec(2000);

    const libItem = (await page.$$(".widget-library__item"))[0];
    const rLib = await libItem.boundingBox();
    await page.mouse.move(rLib.x + rLib.width / 2, rLib.y + rLib.height / 2);
    await sec(150);
    await page.mouse.down();
    await sec(150);
    await page.mouse.up();
    await sec(1800);

    const shell = (await page.$$(".home-editor__item-shell"))[0];
    const srect = await shell.boundingBox();
    await page.mouse.move(srect.x + srect.width / 2, srect.y + srect.height / 2);
    await sec(800);
    await page.click(".home-editor__config");
    await page.waitForSelector(".el-dialog", { timeout: 30000 });
    await sec(2000);

    await page.evaluate(installProbe);

    // 给 ReDialog 内容区塞足量行，撑出内部滚动条
    await page.evaluate(() => {
      const body = document.querySelector(".el-dialog .el-dialog__body");
      if (!body) return "no body";
      const fill = document.createElement("div");
      for (let i = 0; i < 120; i++) {
        const d = document.createElement("div");
        d.textContent = `填充行 ${i + 1} —— 撑出内部滚动条，用于测量滚动帧率`;
        d.style.cssText =
          "height:28px;line-height:28px;border-bottom:1px solid rgba(0,0,0,.06);font-size:13px;white-space:nowrap;";
        fill.appendChild(d);
      }
      body.appendChild(fill);
      return "ok";
    });
    await sec(500);

    // 找内部可滚动容器
    const scrollInfo = await page.evaluate(() => {
      const body = document.querySelector(".el-dialog .el-dialog__body");
      if (!body) return { found: false };
      const cs = getComputedStyle(body);
      return {
        found: true,
        overflowY: cs.overflowY,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
        canScroll: body.scrollHeight > body.clientHeight,
        cls: body.className,
      };
    });
    console.log("ReDialog body 滚动能力:", JSON.stringify(scrollInfo));

    const result = {};

    // ===== A. ReDialog =====
    const dialogA = await page.$(".el-dialog");
    const headerA = await dialogA.$(".el-dialog__header");
    const hA = await headerA.boundingBox();
    const aBox = await dialogA.boundingBox();

    // A1 静态
    let r = await page.evaluate(() => {
      window.__clearP();
      return performance.now();
    }).then((t0) => sec(2000).then(() => page.evaluate((a) => window.__snap(a, performance.now()), t0)));
    result.A_idle = r;

    // A2 拖拽
    let m0 = await metrics(cdp);
    let t0 = await page.evaluate(() => performance.now());
    const headY = hA.y + hA.height / 2;
    const startX = hA.x + 60;
    await page.mouse.move(startX, headY);
    await sec(120);
    await page.mouse.down();
    await sec(80);
    let tStart = Date.now();
    for (let i = 1; i <= 90; i++) {
      await page.mouse.move(startX + i * 3, headY + Math.sin(i * 0.35) * 8);
      const w = tStart + i * 16 - Date.now();
      if (w > 0) await sec(w);
    }
    let t1 = await page.evaluate(() => performance.now());
    await page.mouse.up();
    let m1 = await metrics(cdp);
    result.A_drag = { ...(await page.evaluate((a) => window.__snap(a, performance.now()), t0)), perf: dif(m0, m1) };
    await sec(400);

    // A3 内部滚动
    m0 = await metrics(cdp);
    t0 = await page.evaluate(() => performance.now());
    const sc = await page.evaluate(() => {
      const body = document.querySelector(".el-dialog .el-dialog__body");
      if (!body) return { ok: false };
      body.scrollTop = 0;
      window.__scStart = performance.now();
      window.__scFrames = 0;
      let dir = 1;
      const step = () => {
        if (performance.now() - window.__scStart > 2000) return;
        const before = body.scrollTop;
        body.scrollTop = before + dir * 8;
        if (body.scrollTop === before) dir = -dir;
        window.__scFrames++;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      return { ok: true };
    });
    await sec(2200);
    t1 = await page.evaluate(() => performance.now());
    m1 = await metrics(cdp);
    result.A_scroll = { ...(await page.evaluate((a) => window.__snap(a, performance.now()), t0)), perf: dif(m0, m1), scrolled: sc.ok };
    const scFrames = await page.evaluate(() => window.__scFrames);
    result.A_scroll.scrollFrames = scFrames;

    // 关掉 ReDialog
    await page.click(".el-dialog__headerbtn").catch(() => {});
    await sec(1200);

    // ===== B. 裸 el-dialog =====
    // 用原生 DOM 造一个 el-dialog 等价结构：同一个 class 体系 + draggable 需要事件绑定，
    // 所以直接用 element-plus 的 dialog 实例不方便，这里改为「克隆 ReDialog 的 shell 后
    // 重新绑定原生拖拽」——不，克隆拿不到拖拽。
    // 更可靠：用页面已有的 Vue app 动态挂载一个 ElDialog。见下方 evaluate。
    const launched = await page.evaluate(async () => {
      // 从页面上已有的 app 里拿 Vue 实例
      const appEl = document.querySelector("#app") || document.body;
      const vueApp = appEl.__vue_app__;
      if (!vueApp) return { ok: false, reason: "no __vue_app__" };
      try {
        const { createApp, h, ref } = window.Vue || {};
        if (!createApp) return { ok: false, reason: "no window.Vue" };
        return { ok: false, reason: "window.Vue not global" };
      } catch (e) {
        return { ok: false, reason: e.message };
      }
    });
    console.log("裸 el-dialog 挂载尝试:", JSON.stringify(launched));

    console.log("");
    console.log("=== ReDialog 结果 ===");
    const pf = (o) =>
      `fps=${o.fps}  帧=${o.frames}  时长=${o.ms}ms  最大帧间隔=${o.maxGap}ms  moves=${o.moves}` +
      (o.perf ? `  | 布局=${o.perf.LayoutCount} 样式重算=${o.perf.RecalcStyleCount} 布局耗时=${(o.perf.LayoutDuration * 1000).toFixed(2)}ms` : "");
    console.log("A1 静态空闲 :", pf(result.A_idle));
    console.log("A2 拖拽   :", pf(result.A_drag));
    console.log("A3 滚动   :", pf(result.A_scroll), ` 滚动帧=${result.A_scroll.scrollFrames}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
