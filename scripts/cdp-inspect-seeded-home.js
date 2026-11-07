/** 注入布局后，看首页到底渲染出了什么、点了之后弹窗有没有出来。 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8, type: w.type }));
const PAYLOAD = JSON.stringify({ widgets: WIDGETS, grid: GRID });

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    const t = m.text();
    if (/widget|seed|layout/i.test(t)) console.log("  [console]", t.slice(0, 160));
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
  await sec(3000);

  await page.evaluate((p) => localStorage.setItem("layout", p), PAYLOAD);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(7000);

  const state = await page.evaluate(() => ({
    text: document.querySelector(".home-card")?.innerText?.slice(0, 400),
    html: document.querySelector(".home-card")?.innerHTML?.slice(0, 1200),
    buttons: [...document.querySelectorAll(".home-card button")].map((b) => `${b.className} | ${b.getAttribute("title") || b.textContent?.trim().slice(0, 14)}`),
    layoutInStorage: (localStorage.getItem("layout") || "").slice(0, 200),
  }));
  console.log("首页文本:\n" + state.text);
  console.log("\n按钮:\n" + state.buttons.join("\n"));
  console.log("\nlayout 存储内容:", state.layoutInStorage);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
