/**
 * 弹窗拖拽性能测量 V4。
 *
 * 目标：拿到 idle vs drag 的真实帧率差，确认 element-plus 原生 useDraggable
 * 的 getBoundingClientRect() 整页回流代价有多大。
 *
 * 关键修正（相对 V3）：
 *  1. MutationObserver 必须在弹窗挂载之后再注册，否则永远观察不到 style 改写。
 *  2. 测量窗口由真实鼠标时序驱动：mousedown 开表，mouseup 停表，不再靠固定 800ms。
 *  3. rAF 采样器常驻，按时间区间切片统计，避免启动/停止错位。
 *  4. 滑块等待放宽到 20s，并容忍重试。
 *
 * 输出：idle 帧数 / drag 帧数 / 拖拽期间 mousemove 次数 / transform 改写次数 /
 *       拖拽前后 dialog 位置（证明拖拽真的生效）。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";

const sec = (ms) => new Promise((r) => setTimeout(r, ms));

/** 页面侧常驻探针：按时间段统计 rAF，以及 mousemove / style 改写。 */
function installProbe() {
  const P = {
    frames: [],          // 每个 rAF 的时间戳
    moves: 0,
    styleWrites: 0,
    movesAt: [],         // 每次 mousemove 的时间戳
  };
  window.__P = P;

  const raf = () => {
    P.frames.push(performance.now());
    if (P.frames.length > 20000) P.frames.splice(0, 10000);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.addEventListener("mousemove", () => {
    P.moves++;
    P.movesAt.push(performance.now());
  }, true);

  // 观察器在拿到 dialog 后手动挂载
  window.__watchDialog = () => {
    const el = document.querySelector(".el-dialog");
    if (!el) return "no-dialog";
    if (window.__dialogMO) window.__dialogMO.disconnect();
    window.__dialogMO = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName === "style") P.styleWrites++;
      }
    });
    window.__dialogMO.observe(el, { attributes: true, attributeFilter: ["style"] });
    return "watching";
  };

  /** 取 [t0, t1] 区间的统计。 */
  window.__snap = (t0, t1) => {
    const inRange = (a) => a.filter((x) => x >= t0 && x <= t1);
    const f = inRange(P.frames);
    const m = inRange(P.movesAt);
    return {
      frames: f.length,
      durationMs: Math.round(t1 - t0),
      fps: t1 > t0 ? Math.round((f.length / (t1 - t0)) * 10000) / 10 : 0,
      moves: m.length,
      styleWrites: P.styleWrites,
    };
  };
}

(async () => {
  // C 盘经常 0 可用空间，浏览器 profile 必须落 D 盘
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
    args: ["--no-sandbox", "--disable-background-timer-throttling"],
    downloadsPath: "D:\\ch\\.pw-profile\\downloads",
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log("[page-error]", m.text());
  });

  try {
    await page.goto(TARGET, { waitUntil: "domcontentloaded" });
    await page.evaluate(installProbe);

    // ---------- 登录 ----------
    // 顺序很关键：monitor 的滑块不一定在进页面时就出现，先填账号密码再点登录。
    await page.waitForSelector(".login-form", { timeout: 30000 });
    await page.waitForSelector(".loading-box", { state: "detached", timeout: 30000 }).catch(() => {});
    await sec(800);

    const inputs = page.locator(".login-input .el-input__inner");
    await inputs.first().click();
    await inputs.first().fill("admin");
    await inputs.nth(1).click();
    await inputs.nth(1).fill("admin123");
    await sec(200);
    await page.click(".login-btn");

    // 滑块可选：出现了就拖过去；10s 内没出现说明本次登录免滑块
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
      const steps = 45;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        await page.mouse.move(sx + (ex - sx) * t, sy + Math.sin(t * 6) * 1.5);
        await sec(10);
      }
      await page.mouse.up();
      await sec(1200);
      console.log("slider dragged");

      // 滑块通过后表单会重置，必须重新填写并再次提交
      await inputs.first().fill("admin");
      await inputs.nth(1).fill("admin123");
      await sec(300);
      await page.click(".login-btn", { force: true });
    } else {
      console.log("no slider required this run");
    }

    await page.waitForURL((u) => !/login/.test(u.pathname), { timeout: 30000 });
    await page.waitForSelector(".home-card", { timeout: 40000 });
    console.log("home loaded");
    await sec(2500);

    // ---------- 空闲基线（首页渲染稳定，无弹窗） ----------
    const b0 = await page.evaluate(() => performance.now());
    await sec(1500);
    const b1 = await page.evaluate(() => performance.now());
    const baseIdle = await page.evaluate(([a, b]) => window.__snap(a, b), [b0, b1]);
    console.log("BASELINE idle (home, no dialog):", JSON.stringify(baseIdle));

    // ---------- 进入编辑 + 添加 widget + 打开设置弹窗 ----------
    const editBtn = await page.$(".home-layout-toolbar__btn");
    if (!editBtn) {
      console.log("!! 未找到编辑按钮 .home-layout-toolbar__btn，中止");
      return;
    }
    await editBtn.click();
    await sec(1200);

    const libItem = (await page.$$(".widget-library__item"))[0];
    if (!libItem) {
      console.log("!! 未找到组件库条目 .widget-library__item，中止");
      return;
    }
    const rLib = await libItem.boundingBox();
    await page.mouse.move(rLib.x + rLib.width / 2, rLib.y + rLib.height / 2);
    await sec(120);
    await page.mouse.down();
    await sec(120);
    await page.mouse.up();
    await sec(1500);

    const shell = (await page.$$(".home-editor__item-shell"))[0];
    if (!shell) {
      console.log("!! 拖入组件后没有 .home-editor__item-shell，中止");
      return;
    }
    const srect = await shell.boundingBox();
    await page.mouse.move(srect.x + srect.width / 2, srect.y + srect.height / 2);
    await sec(700);

    const cfg = await page.$(".home-editor__config");
    if (!cfg) {
      console.log("!! 悬停后没有出现 .home-editor__config，中止");
      return;
    }
    await cfg.click();
    await page.waitForSelector(".el-dialog", { timeout: 30000 });
    await sec(1500);
    console.log("dialog state:", await page.evaluate(() => window.__watchDialog()));

    const dialog = await page.$(".el-dialog");
    const dBefore = await dialog.boundingBox();
    const header = await page.$(".el-dialog__header");
    const hrect = await header.boundingBox();
    console.log("dialog before drag:", JSON.stringify(dBefore));
    console.log("header rect:", JSON.stringify(hrect));

    // ---------- 弹窗打开但不拖拽 ----------
    const i0 = await page.evaluate(() => performance.now());
    await sec(1500);
    const i1 = await page.evaluate(() => performance.now());
    const idleDialog = await page.evaluate(([a, b]) => window.__snap(a, b), [i0, i1]);
    console.log("IDLE (dialog open, no drag):", JSON.stringify(idleDialog));

    // ---------- 真实拖拽 ----------
    const headY = hrect.y + hrect.height / 2;
    const startX = hrect.x + 60;
    await page.mouse.move(startX, headY);
    await sec(100);

    const t0 = await page.evaluate(() => {
      window.__P.styleWrites = 0;
      window.__P.moves = 0;
      window.__P.movesAt.length = 0;
      return performance.now();
    });
    await page.mouse.down();
    await sec(80);

    const N = 90;
    const tStart = Date.now();
    for (let i = 1; i <= N; i++) {
      const x = startX + i * 3;
      const y = headY + Math.sin(i * 0.35) * 8;
      await page.mouse.move(x, y);
      // 补足到每帧 ~16ms，让输入速率接近人手 60Hz
      const target = tStart + i * 16;
      const wait = target - Date.now();
      if (wait > 0) await sec(wait);
    }
    const t1 = await page.evaluate(() => performance.now());
    await page.mouse.up();
    await sec(400);

    const dAfter = await dialog.boundingBox();
    const drag = await page.evaluate(([a, b]) => window.__snap(a, b), [t0, t1]);

    console.log("DRAG:", JSON.stringify(drag));
    console.log("dialog after drag:", JSON.stringify(dAfter));
    console.log("dialog moved  dx=", Math.round(dAfter.x - dBefore.x), " dy=", Math.round(dAfter.y - dBefore.y));
    console.log("");
    console.log("=== 汇总 ===");
    console.log(`空闲(首页)      : ${baseIdle.fps} fps`);
    console.log(`空闲(弹窗打开)  : ${idleDialog.fps} fps`);
    console.log(`拖拽中          : ${drag.fps} fps  (${drag.frames} 帧 / ${drag.durationMs}ms)`);
    console.log(`掉帧            : ${Math.round((idleDialog.fps - drag.fps) * 10) / 10} fps`);
    console.log(`拖拽输入次数    : ${drag.moves}`);
    console.log(`transform 改写  : ${drag.styleWrites}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
