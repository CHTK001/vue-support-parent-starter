/** 定位首页布局为何读不到：打印 getLayoutCache 的实际读取结果与存储中所有键。 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, type: w.type, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));
const PAYLOAD = JSON.stringify({ widgets: WIDGETS, grid: GRID });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const page = await browser.newPage();
  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".login-form", { timeout: 45000 });
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
  await sec(3000);

  const r = await page.evaluate(async (p) => {
    // 先写再读，用 @repo/utils 的真实实现
    ["system:2:layout", "2:layout", "system:layout", "layout"].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("2:layout", p);
    const out = { keysAfterWrite: Object.keys(localStorage) };
    try {
      const u = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/utils/src/index.ts");
      out.hasGetLayoutCache = typeof u.getLayoutCache;
      out.cacheRead = JSON.stringify(u.getLayoutCache());
      out.layoutKey = u.LAYOUT_CACHE_KEY;
    } catch (e) {
      out.err = String(e).slice(0, 200);
    }
    return out;
  }, PAYLOAD);

  console.log("已写键:", r.keysAfterWrite.join(", "));
  console.log("getLayoutCache() =>", (r.cacheRead || "").slice(0, 300));
  console.log("err:", r.err || "(无)");

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
