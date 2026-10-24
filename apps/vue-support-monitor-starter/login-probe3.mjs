import { chromium } from "playwright";
const BASE = "http://localhost:8848";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const api = [];
page.on("response", async (r) => {
  const u = r.url();
  if (u.includes("/v2/") && !u.includes("socket")) {
    let body = "";
    try { body = (await r.text()).slice(0, 160); } catch {}
    api.push(`${r.status()} ${u.replace(BASE, "")} :: ${body}`);
  }
});
try {
  await page.goto(`${BASE}/index.html`);
  await sleep(7000);
  const ins = page.locator("input");
  await ins.nth(0).fill("admin");
  await ins.nth(1).fill("admin123");
  await page.locator("button").filter({ hasText: /^\s*登录\s*$/ }).first().click();
  await sleep(9000);
  console.log("url:", page.url());
  console.log("=== /v2 接口响应 ===");
  api.slice(0, 12).forEach((a) => console.log(" ", a));
} catch (e) {
  console.log("ERR:", e.message);
}
await browser.close();