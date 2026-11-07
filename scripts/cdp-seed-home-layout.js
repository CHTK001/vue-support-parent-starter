/**
 * 找出首页布局缓存键，并注入一个能打开业务弹窗的临时布局。
 *
 * 首页当前是空的（尚未配置仪表板），所以真实业务弹窗（闹钟 / 快捷 / 书签）
 * 根本没有入口。这里只往 **localStorage** 写一个临时布局，让这些组件渲染出来，
 * 测完用 --clear 删掉。
 *
 * 用法：
 *   node scripts/cdp-seed-home-layout.js           # 列出键并注入
 *   node scripts/cdp-seed-home-layout.js --clear   # 清除
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const CLEAR = process.argv.includes("--clear");

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
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

  const keys = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out.push({ k, v: (localStorage.getItem(k) || "").slice(0, 160) });
    }
    return out;
  });
  console.log("=== localStorage 全部键 ===");
  keys.forEach((o) => console.log(`  ${o.k}\n     ${o.v.replace(/\n/g, " ")}`));

  // 布局键的命名规则：prefix:uid:layout
  const layoutKeys = keys.map((o) => o.k).filter((k) => /layout/i.test(k));
  console.log("\n布局相关键:", layoutKeys.length ? layoutKeys.join(", ") : "(无)");

  // 同时读 sessionStorage
  const sk = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      out.push(k);
    }
    return out;
  });
  console.log("sessionStorage 键:", sk.join(", ") || "(无)");

  if (CLEAR) {
    await page.evaluate((lk) => {
      lk.forEach((k) => localStorage.removeItem(k));
    }, layoutKeys);
    console.log("\n已清除布局缓存键:", layoutKeys.join(", ") || "(无)");
  } else {
    const payload = JSON.stringify({ widgets: WIDGETS, grid: GRID });
    const written = await page.evaluate(
      ([lk, p]) => {
        const target = lk[0] || "layout";
        localStorage.setItem(target, p);
        return { key: target, readback: (localStorage.getItem(target) || "").slice(0, 120) };
      },
      [layoutKeys, payload]
    );
    console.log("\n已写入:", written.key);
    console.log("回读:", written.readback);
    console.log("payload:", payload);
  }

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
