import { chromium } from "playwright";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP = process.env.MS_APP || "http://127.0.0.1:8848";
const API = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  await ensureLogin(page, APP, API, E2E_CREDS).catch(e => console.log("login:", e.message));
  await page.goto(`${APP}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  console.log("=== BODY (first 2500) ===");
  console.log(body.slice(0, 2500));
  const items = await page.locator("aside .el-menu-item, aside .el-sub-menu__title, .sidebar .el-menu-item, .sidebar .el-sub-menu__title").allInnerTexts().catch(() => []);
  console.log("=== MENU ITEMS ===");
  console.log([...new Set(items.map(s => s.trim()).filter(Boolean))].join(" | "));
} finally {
  await browser.close();
}
