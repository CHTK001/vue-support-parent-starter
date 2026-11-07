/**
 * 在 8848 上验证布局缓存键：
 *   1) 读 config.storage 的规则，确定 "layout" 到底落在哪个 localStorage 键
 *   2) 用候选键写入，reload 看首页是否渲染出 widget
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, type: w.type, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));
const PAYLOAD = JSON.stringify({ widgets: WIDGETS, grid: GRID });

// 候选：可能的前缀形态（storage.prefix 取 app.systemCode）
const CANDIDATES = ["2:layout", "system:layout", "admin:layout", "layout"];

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox"],
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
  await sec(4000);

  // 读页面里的 config（挂到 window 上的话）
  const cfgInfo = await page.evaluate(() => {
    const win = window;
    const cand = Object.keys(win).filter((k) => /config|__RE|appConfig/i.test(k)).slice(0, 10);
    let cfg = null;
    try {
      cfg = win.__APP_CONFIG__ || win.__CONFIG__ || null;
    } catch {}
    const storage = cfg && cfg.storage ? cfg.storage : null;
    const app = cfg && cfg.app ? cfg.app : null;
    return { keys: cand, storage, systemCode: app && app.systemCode, layoutConfig: cfg && cfg.layoutConfig };
  });
  console.log("=== 页面 config 探测 ===");
  console.log(JSON.stringify(cfgInfo, null, 2));

  // 逐个候选键试
  for (const key of CANDIDATES) {
    await page.evaluate(
      ([k, p]) => {
        // 先清掉所有候选
        ["2:layout", "system:layout", "admin:layout", "layout"].forEach((x) => localStorage.removeItem(x));
        localStorage.setItem(k, p);
      },
      [key, PAYLOAD]
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-card", { timeout: 70000 }).catch(() => {});
    await sec(6000);
    const r = await page.evaluate(() => {
      const txt = document.querySelector(".home-card")?.innerText || "";
      const btns = [...document.querySelectorAll(".home-card button")].map((b) => b.className);
      return {
        empty: txt.includes("尚未配置仪表板"),
        alarms: btns.filter((c) => /aw__/.test(c)),
        quick: btns.filter((c) => /qw__/.test(c)),
        bookmark: btns.filter((c) => /bw__/.test(c)),
      };
    });
    console.log(`\n候选键 "${key}": 空=${r.empty}  闹钟按钮=${r.alarms.length} 快捷=${r.quick.length} 书签=${r.bookmark.length}`);
    if (!r.empty) {
      console.log("  ✅ 命中");
      break;
    }
  }

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
