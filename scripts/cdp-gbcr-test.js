/**
 * 定位：getBoundingClientRect 是否是样式重算的直接触发者。
 *
 * 三个分支，各拖 150 步，看 UpdateLayoutTree 次数：
 *   A. 正常拖（element-plus 原样）
 *   B. 把 getBoundingClientRect 换成缓存的（不改拖拽逻辑，只改返回值来源）
 *   C. 不拖，只反复调 element 的 getBoundingClientRect（排除鼠标事件本身的开销）
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
    args: ["--no-sandbox", "--start-maximized"],
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

  async function traceRound(label, fn) {
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", {
      categories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "blink.user_timing",
        "latencyInfo",
        "benchmark",
        "v8.execute",
        "cc",
        "gpu",
        "blink",
        "toplevel",
      ].join(","),
      options: "sampling-frequency=10000",
      transferMode: "ReportEvents",
    });
    await sec(700);
    await fn();
    await sec(500);
    const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    await done;
    await sec(300);
    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const r = {
      label,
      ult: ult.length,
      ultMs: +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1),
      recalc: xs.filter((e) => e.name === "Document::recalcStyle").length,
    };
    console.log(`【${label}】样式重算 ${r.ult} 次 / ${r.ultMs}ms   recalcStyle ${r.recalc} 次`);
    return r;
  }

  async function dragSteps(n) {
    const h = await page.locator(".el-dialog__header").first().boundingBox();
    const sx2 = h.x + 60;
    const y2 = h.y + h.height / 2;
    await page.mouse.move(sx2, y2);
    await sec(120);
    await page.mouse.down();
    await sec(80);
    const t = Date.now();
    for (let i = 1; i <= n; i++) {
      await page.mouse.move(sx2 + i * 1.8, y2 + Math.sin(i * 0.15) * 9);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
  }

  const results = [];

  // ---------- A 正常拖 ----------
  await page.click(".aw__add", { force: true });
  await sec(1800);
  results.push(await traceRound("A 正常拖拽", () => dragSteps(150)));
  await page.keyboard.press("Escape");
  await sec(1500);

  // ---------- B 缓存 getBoundingClientRect 后拖 ----------
  await page.click(".aw__add", { force: true });
  await sec(1800);
  await page.evaluate(() => {
    // 只让「被拖的弹窗元素」读取缓存；其它元素照旧。
    const orig = Element.prototype.getBoundingClientRect;
    window.__origGBCR = orig;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains("el-dialog")) {
        if (!this.__cachedRect) {
          const r = orig.call(this);
          // 缓存一份，拖拽期间不再真正查询布局
          this.__cachedRect = { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom, toJSON() { return this; } };
        }
        return this.__cachedRect;
      }
      return orig.call(this);
    };
  });
  results.push(await traceRound("B getBoundingClientRect 走缓存", () => dragSteps(150)));

  // 恢复
  await page.evaluate(() => {
    if (window.__origGBCR) Element.prototype.getBoundingClientRect = window.__origGBCR;
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    if (d) delete d.__cachedRect;
  });
  await sec(500);

  // ---------- C 只调 getBoundingClientRect，不拖 ----------
  results.push(
    await traceRound("C 只反复调 getBoundingClientRect（不拖）", async () => {
      for (let i = 0; i < 150; i++) {
        await page.evaluate(() => {
          const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
          if (d) {
            d.style.transform = `translate(${Math.random() * 40}px, ${Math.random() * 20}px)`;
            d.getBoundingClientRect();
          }
        });
        await sec(8);
      }
    })
  );

  console.log("\n==================== 汇总 ====================");
  console.log("分支                           样式重算次数   重算耗时    recalcStyle");
  results.forEach((r) => {
    console.log(
      `${r.label.padEnd(30)} ${String(r.ult).padStart(10)} ${String(r.ultMs + "ms").padStart(10)} ${String(r.recalc).padStart(11)}`
    );
  });

  await sec(500);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
