// 诊断：浏览器登录为什么没成功 —— dump 登录页结构 + 抓登录请求的响应。
import { chromium } from "playwright";
const BASE = process.env.PW_BASE;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 150)));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 150)); });
const xhr = [];
page.on("response", async (r) => {
  if (r.url().includes("/user/login")) {
    let body = "";
    try { body = (await r.text()).slice(0, 200); } catch { /* ignore */ }
    xhr.push(`${r.status()} ${r.url()} -> ${body}`);
  }
});

await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(8000);
console.log("hash =", await page.evaluate(() => location.hash));
const form = await page.evaluate(() => ({
  inputs: [...document.querySelectorAll("input")].map((i) => ({
    type: i.getAttribute("type"), ph: i.getAttribute("placeholder"), vis: i.offsetParent !== null,
  })),
  buttons: [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null).map((b) => (b.innerText || "").trim()).filter(Boolean).slice(0, 6),
  text: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 200),
}));
console.log("inputs =", JSON.stringify(form.inputs));
console.log("buttons =", JSON.stringify(form.buttons));
console.log("body =", form.text);

console.log("=== 尝试登录 ===");
try {
  await page.locator('input[type="text"]').first().fill("sa");
  await page.locator('input[type="password"]').first().fill("admin123");
  await page.locator("button", { hasText: "登录" }).first().click();
  await page.waitForTimeout(8000);
} catch (e) { console.log("  操作异常: " + String(e).slice(0, 120)); }
console.log("登录后 hash =", await page.evaluate(() => location.hash));
console.log("登录请求 =", JSON.stringify(xhr));
console.log("错误 =", errs.length ? errs.slice(0, 4).join(" | ") : "无");
await page.screenshot({ path: "D:/ch/project/Temp/opencode/login-diag.png" });
await browser.close();
