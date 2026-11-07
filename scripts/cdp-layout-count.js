/**
 * 弹窗拖拽性能测量 V5：用 CDP Performance.getMetrics 量化强制回流。
 *
 * 为什么换这个口径：
 *   V4 用页面侧 rAF 得到"拖拽不掉帧"，但 headless 下 rAF 有 ~75fps 上限，
 *   会把真实开销吃掉。Performance.getMetrics 给的是引擎计数器：
 *     LayoutCount          —— 布局（回流）次数，getBoundingClientRect 的代价就在这里
 *     RecalcStyleCount     —— 样式重算次数
 *     LayoutDuration / RecalcStyleDuration —— 累计耗时（秒）
 *   把这些做成"每帧 / 每次 mousemove"的增量，就能看清拖拽到底贵不贵。
 *
 * 对照：同样时长、同样次数的 mousemove，但不在拖拽态（鼠标空移）。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

function installProbe() {
  const P = { frames: [], movesAt: [] };
  const raf = () => {
    P.frames.push(performance.now());
    if (P.frames.length > 40000) P.frames.splice(0, 20000);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  document.addEventListener(
    "mousemove",
    () => {
      P.movesAt.push(performance.now());
    },
    true
  );
  window.__P = P;
  window.__snap = (t0, t1) => {
    const inR = (a) => a.filter((x) => x >= t0 && x <= t1);
    const f = inR(P.frames);
    const m = inR(P.movesAt);
    return {
      frames: f.length,
      fps: t1 > t0 ? Math.round((f.length / (t1 - t0)) * 10000) / 10 : 0,
      moves: m.length,
      durationMs: Math.round(t1 - t0),
    };
  };
}

async function metrics(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const get = (n) => metrics.find((m) => m.name === n)?.value ?? 0;
  return {
    LayoutCount: get("LayoutCount"),
    RecalcStyleCount: get("RecalcStyleCount"),
    LayoutDuration: get("LayoutDuration"),
    RecalcStyleDuration: get("RecalcStyleDuration"),
    Nodes: get("Nodes"),
    JSHeapUsedSize: get("JSHeapUsedSize"),
  };
}

function diff(a, b, keys) {
  const out = {};
  for (const k of keys) out[k] = Math.round((b[k] - a[k]) * 10000) / 10000;
  return out;
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
    await page.goto(TARGET, { waitUntil: "domcontentloaded" });
    await page.evaluate(installProbe);

    // ---------- 登录 ----------
    await page.waitForSelector(".login-form", { timeout: 30000 });
    await page.waitForSelector(".loading-box", { state: "detached", timeout: 30000 }).catch(() => {});
    await sec(800);

    const inputs = page.locator(".login-input .el-input__inner");
    await inputs.first().fill("admin");
    await inputs.nth(1).fill("admin123");
    await sec(200);
    await page.click(".login-btn", { force: true });

    const track = await page
      .waitForSelector(".slider-verify-track", { timeout: 10000 })
      .catch(() => null);

    if (track) {
      await sec(400);
      const rect = await track.boundingBox();
      const sx = rect.x + rect.width * 0.12;
      const ex = rect.x + rect.width - 4;
      const sy = rect.y + rect.height / 2;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      for (let i = 0; i <= 45; i++) {
        const t = i / 45;
        await page.mouse.move(sx + (ex - sx) * t, sy);
        await sec(10);
      }
      await page.mouse.up();
      await sec(1200);
      // 滑块通过后表单会重置，需重填再提交
      await inputs.first().fill("admin");
      await inputs.nth(1).fill("admin123");
      await sec(300);
      await page.click(".login-btn", { force: true });
      console.log("slider dragged + resubmitted");
    } else {
      console.log("no slider this run");
    }

    await page.waitForURL((u) => !/login/.test(u.pathname), { timeout: 45000 });
    await page.waitForSelector(".home-card", { timeout: 60000 });
    console.log("home loaded");
    await sec(5000);

    // ---------- 进入编辑 + 打开设置弹窗 ----------
    await page.waitForSelector(".home-layout-toolbar__btn", { state: "visible", timeout: 30000 });
    await page.click(".home-layout-toolbar__btn", { force: true });
    await sec(2000);

    const libItem = (await page.$$(".widget-library__item"))[0];
    if (!libItem) throw new Error("找不到 .widget-library__item");
    const rLib = await libItem.boundingBox();
    await page.mouse.move(rLib.x + rLib.width / 2, rLib.y + rLib.height / 2);
    await sec(150);
    await page.mouse.down();
    await sec(150);
    await page.mouse.up();
    await sec(1800);

    const shell = (await page.$$(".home-editor__item-shell"))[0];
    if (!shell) throw new Error("拖入组件后没出现 .home-editor__item-shell");
    const srect = await shell.boundingBox();
    await page.mouse.move(srect.x + srect.width / 2, srect.y + srect.height / 2);
    await sec(800);

    await page.click(".home-editor__config");
    await page.waitForSelector(".el-dialog", { timeout: 30000 });
    await sec(2000);
    console.log("dialog opened");

    // 登录跳转会整页重载，之前注入的探针已失效，这里重新注入
    await page.evaluate(installProbe);

    const dialog = await page.$(".el-dialog");
    const header = await page.$(".el-dialog__header");
    const hrect = await header.boundingBox();
    const dBefore = await dialog.boundingBox();

    const KEYS = ["LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration"];

    // ---------- A. 基线：弹窗开着，什么都不做 ----------
    let m0 = await metrics(cdp);
    let t0 = await page.evaluate(() => performance.now());
    await sec(2000);
    let t1 = await page.evaluate(() => performance.now());
    let m1 = await metrics(cdp);
    const idle = { delta: diff(m0, m1, KEYS), page: await page.evaluate(([a, b]) => window.__snap(a, b), [t0, t1]) };
    console.log("A 静态空闲 :", JSON.stringify(idle));

    // ---------- B. 对照：鼠标空移（不按鼠标键，弹窗不动） ----------
    m0 = await metrics(cdp);
    t0 = await page.evaluate(() => performance.now());
    const N = 90;
    let tStart = Date.now();
    for (let i = 1; i <= N; i++) {
      const x = 200 + ((i * 5) % 500);
      const y = 700 + Math.sin(i * 0.35) * 20;
      await page.mouse.move(x, y);
      const wait = tStart + i * 16 - Date.now();
      if (wait > 0) await sec(wait);
    }
    t1 = await page.evaluate(() => performance.now());
    m1 = await metrics(cdp);
    const bareMove = { delta: diff(m0, m1, KEYS), page: await page.evaluate(([a, b]) => window.__snap(a, b), [t0, t1]) };
    console.log("B 空移鼠标 :", JSON.stringify(bareMove));

    // ---------- C. 真实拖拽 header ----------
    const headY = hrect.y + hrect.height / 2;
    const startX = hrect.x + 60;
    await page.mouse.move(startX, headY);
    await sec(150);

    m0 = await metrics(cdp);
    t0 = await page.evaluate(() => performance.now());
    await page.mouse.down();
    await sec(80);

    tStart = Date.now();
    for (let i = 1; i <= N; i++) {
      const x = startX + i * 3;
      const y = headY + Math.sin(i * 0.35) * 8;
      await page.mouse.move(x, y);
      const wait = tStart + i * 16 - Date.now();
      if (wait > 0) await sec(wait);
    }
    t1 = await page.evaluate(() => performance.now());
    m1 = await metrics(cdp);
    await page.mouse.up();
    await sec(500);

    const drag = { delta: diff(m0, m1, KEYS), page: await page.evaluate(([a, b]) => window.__snap(a, b), [t0, t1]) };
    const dAfter = await dialog.boundingBox();
    console.log("C 拖拽中   :", JSON.stringify(drag));

    console.log("");
    console.log("=== 汇总（同样 90 次 mousemove） ===");
    console.log("场景            布局次数  样式重算  布局耗时(s)  样式耗时(s)  fps    moves");
    const fmt = (name, r) =>
      `${name.padEnd(14)}  ${String(r.delta.LayoutCount).padStart(7)}  ${String(r.delta.RecalcStyleCount).padStart(7)}  ${String(r.delta.LayoutDuration).padStart(10)}  ${String(r.delta.RecalcStyleDuration).padStart(10)}  ${String(r.page.fps).padStart(5)}  ${String(r.page.moves).padStart(5)}`;
    console.log(fmt("A 静态空闲", idle));
    console.log(fmt("B 空移鼠标", bareMove));
    console.log(fmt("C 拖拽中", drag));
    console.log("");
    console.log("弹窗位移 dx=", Math.round(dAfter.x - dBefore.x), " dy=", Math.round(dAfter.y - dBefore.y));

    if (drag.page.moves > 0) {
      console.log(
        `拖拽时每次 mousemove 平均布局次数: ${(drag.delta.LayoutCount / drag.page.moves).toFixed(2)}`
      );
      console.log(
        `拖拽时每次 mousemove 平均布局耗时: ${((drag.delta.LayoutDuration * 1000) / drag.page.moves).toFixed(2)} ms`
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
