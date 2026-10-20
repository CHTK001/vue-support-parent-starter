/**
 * 轻量探针：加载 /#/acme，打印统计卡数值与 ACME 接口响应，用于区分
 * 「功能回归」与「内存导致的浏览器死亡」。拦截图片/字体/媒体以降内存。
 */
import { chromium } from "playwright";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP = process.env.MS_APP || "http://127.0.0.1:8898";
const API_LOGIN = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
const page = await context.newPage();
await page.route("**/*", (route) => {
  const t = route.request().resourceType();
  if (t === "image" || t === "font" || t === "media") return route.abort();
  return route.continue();
});
const api = [];
page.on("response", (r) => { if (/\/monitor\/api\/v1\/cert/.test(r.url())) api.push(r.status() + " " + r.url().replace(APP, "")); });
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e.message).slice(0, 160)));

try {
  const got = await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  console.log("login:", got.ok, got.msg.slice(0, 50));
  await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(4000);
  const stats = await page.locator(".stat-card").evaluateAll((els) => els.map((e) => e.innerText.replace(/\s+/g, " ").trim()));
  console.log("stats:", JSON.stringify(stats));
  const cnt = await page.locator(".filter-bar .filter-count").first().innerText().catch(() => "(none)");
  console.log("filterCount:", cnt.replace(/\s+/g, " "));
  console.log("acme api responses:\n  " + api.join("\n  "));
} catch (e) {
  console.log("PROBE-A ERROR:", String(e.message).slice(0, 200));
} finally {
  await browser.close();
}
