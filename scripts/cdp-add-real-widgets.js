/**
 * 走正规 UI 路径添加真实业务组件并保存：
 *   自定义布局 -> 点组件库里的「闹钟 / 书签 / 快捷入口」-> 保存 -> 回浏览模式
 *
 * 这样生成的布局与用户手动操作完全一致，测的是系统里真实存在的弹窗。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const CLEAR = process.argv.includes("--clear");

const ADD = CLEAR ? [] : ["闹钟", "书签", "快捷入口"];

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
  await sec(4000);

  await page.locator(".home-layout-toolbar__btn").first().click({ force: true });
  await sec(2500);

  if (CLEAR) {
    // 清空预览里的所有组件：逐个点掉删除按钮（若有），再保存
    await page.evaluate(() => localStorage.removeItem("system:2:layout"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await sec(5000);
    console.log("已清除布局缓存");
    await browser.close();
    return;
  }

  for (const name of ADD) {
    const item = page.locator(".widget-library__item", { hasText: name }).first();
    if ((await item.count()) === 0) {
      console.log(`组件库里没有「${name}」`);
      continue;
    }
    await item.click({ force: true });
    await sec(700);
    console.log(`已添加: ${name}`);
  }

  // 保存
  const saveBtn = page.locator("button", { hasText: /^保存$/ }).first();
  await saveBtn.click({ force: true });
  await sec(2500);
  console.log("已点保存");

  const after = await page.evaluate(() => ({
    empty: (document.querySelector(".home-card")?.innerText || "").includes("尚未配置仪表板"),
    renderers: document.querySelectorAll(".widget-renderer").length,
    keys: Object.keys(localStorage).filter((k) => /layout/i.test(k)),
  }));
  console.log("保存后:", JSON.stringify(after));

  await sec(1500);
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
