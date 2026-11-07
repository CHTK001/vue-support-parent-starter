/**
 * 探测：点击组件目录 item 后，预览区是否出现 widget 格子 / 配置按钮。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
let page;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--no-sandbox"] });
  const ctx = await browser.newContext();
  page = await ctx.newPage();

  await page.goto(TARGET, { waitUntil: "networkidle" });
  await new Promise((r) => setTimeout(r, 3000));
  await page.waitForSelector(".login-form", { timeout: 15000 });
  const track = await page.$(".slider-verify-track");
  const rect = await track.boundingBox();
  const sx = rect.x + rect.width * 0.1;
  const ex = rect.x + rect.width - 3;
  await page.mouse.move(sx, rect.y + rect.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 40; i++) {
    const x = sx + (ex - sx) * (i / 39);
    await page.mouse.move(x, rect.y + rect.height / 2);
    await new Promise((r) => setTimeout(r, 12));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 600));
  const inputs = page.locator(".login-input .el-input__inner");
  await inputs.first().click();
  await inputs.first().press("Control+a");
  await inputs.first().press("Backspace");
  await inputs.first().type("admin", { delay: 30 });
  await inputs.nth(1).click();
  await inputs.nth(1).press("Control+a");
  await inputs.nth(1).press("Backspace");
  await inputs.nth(1).type("admin123", { delay: 30 });
  await page.click(".login-btn");
  await page.waitForURL(/(home|\/)/, { timeout: 15000 });
  await page.waitForSelector(".home-card", { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  await page.click(".home-layout-toolbar__btn");
  await new Promise((r) => setTimeout(r, 800));
  const items = await page.$$(".widget-library__item");
  console.log("lib items:", items.length);
  const firstLib = items[0];
  const r2 = await firstLib.boundingBox();
  await page.mouse.move(r2.x + r2.width / 2, r2.y + r2.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 1000));
  console.log("post-edit item shells:", (await page.$$(".home-editor__item-shell")).length);
  const shell = (await page.$$(".home-editor__item-shell"))[0];
  if (shell) {
    const srect = await shell.boundingBox();
    await page.mouse.move(srect.x + srect.width / 2, srect.y + srect.height / 2);
    await new Promise((r) => setTimeout(r, 500));
    console.log("config visible:", await page.isVisible(".home-editor__config"));
    console.log("remove visible:", await page.isVisible(".home-editor__remove"));
  }

  await browser.close();
})();
