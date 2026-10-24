import { chromium } from "playwright";
const BASE = "http://localhost:8848";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
try {
  await page.goto(`${BASE}/index.html`);
  await sleep(7000);
  const ins = page.locator("input");
  await ins.nth(0).fill("admin");
  await ins.nth(1).fill("admin123");
  const btn = page.locator("button").filter({ hasText: /^\s*登录\s*$/ }).first();
  await btn.click();
  // 等待跳转（最多 20s）
  let ok = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    if (!page.url().includes("/login")) { ok = true; break; }
  }
  console.log("登录:", ok ? "成功" : "失败", "| url:", page.url());
  await sleep(3000);
  const t = await page.locator("body").innerText().catch(() => "");
  console.log("登录后文本:", t.replace(/\s+/g, " ").slice(0, 180));
} catch (e) {
  console.log("ERR:", e.message);
}
await browser.close();