/**
 * 摸底：当前 tokenStorage 里 "layout" 落在哪个键。
 * 做法：注入一个记录 setItem/set 调用的探针，再触发一次首页保存（或直接看 buildKey 结果）。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // 在页面脚本执行前挂探针：记录 localStorage.setItem 的 key
  await ctx.addInitScript(() => {
    window.__SETLOG__ = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      try {
        window.__SETLOG__.push({ k, v: String(v).slice(0, 80), t: Date.now() });
      } catch {}
      return orig.call(this, k, v);
    };
  });

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

  // 进入自定义布局 -> 添加一个组件 -> 保存，观察写入了哪个键
  await page.locator(".home-layout-toolbar__btn").first().click({ force: true });
  await sec(2500);
  const editInfo = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 500),
    items: [...document.querySelectorAll(".widget-library__item")].map((e) => e.innerText.replace(/\n/g, " ").slice(0, 30)),
  }));
  console.log("=== 编辑模式 ===");
  console.log(editInfo.text);
  console.log("组件库:", JSON.stringify(editInfo.items, null, 1));

  await page.screenshot({ path: "D:\\ch\\.trace\\edit-mode.png" });

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
