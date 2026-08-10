const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, viewport: { width: 1920, height: 1080 } });
  const p = await b.newPage();
  p.on("response", () => {});

  await p.goto("http://127.0.0.1:5173/login", { waitUntil: "load", timeout: 10000 });
  await p.locator("input").nth(0).fill("admin");
  await p.locator("input[type='password']").first().fill("admin123");
  await p.locator("button:has-text('\u767b\u5f55')").first().click();
  await p.waitForTimeout(4000);

  // Try clicking "用户管理"
  const mm = await p.locator("[role=menuitem]").all();
  console.log(`[role=menuitem] count: ${mm.length}`);
  for (let i = 0; i < mm.length; i++) {
    const t = await mm[i].innerText();
    console.log(`  [${i}] "${t.trim().substring(0, 30)}"`);
  }

  // Also try el-menu-item
  const elmm = await p.locator(".el-menu-item").all();
  console.log(`.el-menu-item count: ${elmm.length}`);
  for (let i = 0; i < Math.min(elmm.length, 20); i++) {
    const t = await elmm[i].innerText();
    console.log(`  [${i}] "${t.trim().substring(0, 30)}"`);
  }

  // Also try text
  const texts = await p.locator("text=用户管理").all();
  console.log(`"用户管理" count: ${texts.length}`);
  if (texts.length > 0) {
    await texts[0].click();
    await p.waitForTimeout(2000);
    console.log("After click:", p.url());
  }

  await b.close();
})();
