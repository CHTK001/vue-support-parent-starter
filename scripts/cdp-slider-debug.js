const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
    args: ["--no-sandbox"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const page = await browser.newPage();
  page.on("response", async (r) => {
    const u = r.url();
    if (/login|auth|captcha|user\//i.test(u) && !/\.(js|css|ts|vue|svg|woff|png)/.test(u)) {
      let b = ""; try { b = (await r.text()).slice(0, 400); } catch {}
      console.log(`[${r.status()}] ${r.request().method()} ${u}`);
      if (b) console.log("    ", b.replace(/\s+/g, " "));
    }
  });

  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".login-form", { timeout: 30000 });
  await page.waitForSelector(".loading-box", { state: "detached", timeout: 30000 }).catch(() => {});
  await sec(800);

  const inputs = page.locator(".login-input .el-input__inner");
  await inputs.first().fill("admin");
  await inputs.nth(1).fill("admin123");
  await sec(200);
  await page.click(".login-btn", { force: true });

  const track = await page.waitForSelector(".slider-verify-track", { timeout: 8000 });
  await sec(300);
  const rect = await track.boundingBox();
  const sx = rect.x + rect.width * 0.12;
  const ex = rect.x + rect.width - 4;
  const sy = rect.y + rect.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 0; i <= 45; i++) {
    const t = i / 45;
    await page.mouse.move(sx + (ex - sx) * t, sy);
    await sec(12);
  }
  await page.mouse.up();
  await sec(1200);

  console.log("滑块后输入框值:", await page.evaluate(() =>
    [...document.querySelectorAll(".login-input .el-input__inner")].map((i) => i.value)
  ));

  // 重新填一次再登录
  await inputs.first().fill("admin");
  await inputs.nth(1).fill("admin123");
  await sec(300);
  console.log("重新填写后:", await page.evaluate(() =>
    [...document.querySelectorAll(".login-input .el-input__inner")].map((i) => i.value)
  ));
  await page.click(".login-btn", { force: true });

  await sec(6000);
  console.log("URL:", page.url());
  console.log("body:", (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 250));
  await browser.close();
})();
