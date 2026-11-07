/**
 * 有头浏览器 + 系统真实首页：测 ReDialog 与 ElDialog 的拖拽 / 滚动帧率。
 *
 * 走的是真实登录 → 真实首页 → 页面右下角「弹窗性能对比」面板，
 * 两个弹窗分别是 @repo/ui/re-dialog 和 element-plus 的 ElDialog。
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
  page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 200)));

  // ---------- 登录 ----------
  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".login-form", { timeout: 40000 });
  await page.waitForSelector(".loading-box", { state: "detached", timeout: 40000 }).catch(() => {});
  await sec(800);

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
  console.log("首页已加载（有头浏览器）");
  console.log("面板 idle FPS:", await page.textContent(".dlg-fps__fps"));

  async function rows() {
    return page.evaluate(() =>
      [...document.querySelectorAll(".dlg-fps__table tbody tr")].map((tr) =>
        [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())
      )
    );
  }

  async function drag(which) {
    const h = await page.locator(".el-dialog__header").first().boundingBox();
    if (!h) return "no header";
    const sx = h.x + 60;
    const y = h.y + h.height / 2;
    await page.mouse.move(sx, y);
    await sec(120);
    await page.mouse.down();
    await sec(80);
    const t = Date.now();
    for (let i = 1; i <= 90; i++) {
      await page.mouse.move(sx + i * 3, y + Math.sin(i * 0.35) * 8);
      const w = t + i * 16 - Date.now();
      if (w > 0) await sec(w);
    }
    await page.mouse.up();
    await sec(2600);
    return "dragged";
  }

  async function scroll() {
    await page.evaluate(() => {
      const body = [...document.querySelectorAll(".el-dialog__body")].find((b) => b.offsetParent !== null);
      if (!body) return;
      body.scrollTop = 0;
      const t0 = performance.now();
      const step = () => {
        if (performance.now() - t0 > 2000) return;
        body.scrollTop += 10;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    await sec(2800);
  }

  // ---------- ① ReDialog ----------
  await page.click(".dlg-fps__btn--primary");
  await sec(1400);
  const reCls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log("\n① ReDialog class:", reCls);
  await drag();
  await scroll();

  await page.keyboard.press("Escape");
  await sec(1400);

  // ---------- ② ElDialog ----------
  await page.click(".dlg-fps__btn:not(.dlg-fps__btn--primary)");
  await sec(1400);
  const elCls = await page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
    return d ? d.className : "none";
  });
  console.log("② ElDialog class:", elCls);
  await drag();
  await scroll();

  await sec(800);
  console.log("\n实时 FPS:", await page.textContent(".dlg-fps__fps"));
  console.log("\n=== 记录表 ===");
  (await rows()).forEach((r) => console.log(r.join("  |  ")));

  await sec(1500);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
