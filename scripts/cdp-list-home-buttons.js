/** 列出首页上的 widget 容器与它们内部的按钮，找出能打开真实业务弹窗的入口。 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
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
  await sec(6000);

  const info = await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".home-card button")].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        cls: b.className,
        text: (b.textContent || "").trim().slice(0, 20),
        title: b.getAttribute("title") || "",
        visible: r.width > 0 && r.height > 0,
        x: Math.round(r.x),
        y: Math.round(r.y),
      };
    });
    const widgets = [...document.querySelectorAll(".widget-renderer, [class*='widget']")]
      .filter((e) => e.children.length && e.getBoundingClientRect().width > 100)
      .slice(0, 30)
      .map((e) => ({ cls: String(e.className).slice(0, 60), w: Math.round(e.getBoundingClientRect().width) }));
    return { btns, widgets, text: document.querySelector(".home-card")?.textContent?.slice(0, 600) };
  });
  console.log(JSON.stringify(info.btns, null, 1));
  console.log("\n--- widgets ---");
  console.log(JSON.stringify(info.widgets, null, 1));
  console.log("\n--- 首页文本 ---");
  console.log(info.text);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
