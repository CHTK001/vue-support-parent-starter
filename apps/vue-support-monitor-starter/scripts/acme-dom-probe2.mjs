/**
 * 探针 2：vxe 行 DOM 结构（主表 vs 固定右列，行内按钮如何定位）+ blob 下载是否触发 download 事件。
 */
import { chromium } from "playwright";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP = process.env.MS_APP || "http://127.0.0.1:8898";
const API_LOGIN = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();

try {
  await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ timeout: 60000 });
  await page.waitForTimeout(2500);

  console.log("=== main wrapper first row html (truncated) ===");
  console.log((await page.locator(".vxe-table--main-wrapper .vxe-body--row").first().innerHTML()).replace(/\s+/g, " ").slice(0, 900));
  console.log("\n=== fixed-right wrapper count ===", await page.locator(".vxe-table--fixed-right-wrapper").count());
  if (await page.locator(".vxe-table--fixed-right-wrapper .vxe-body--row").count()) {
    console.log((await page.locator(".vxe-table--fixed-right-wrapper .vxe-body--row").first().innerHTML()).replace(/\s+/g, " ").slice(0, 700));
    console.log("fixed row has domain text? ", (await page.locator(".vxe-table--fixed-right-wrapper .vxe-body--row").first().innerText()).includes("acme-valid-far"));
  }
  console.log("main row contains buttons? ", await page.locator(".vxe-table--main-wrapper .vxe-body--row").first().locator("button").count());

  // 详情：等待内容
  await page.locator('input[placeholder="主域名"]').fill("acme-valid-far.example.com");
  await page.locator('input[placeholder="主域名"]').press("Enter");
  await page.waitForTimeout(1500);
  await page.locator(".op-cell button.el-button:visible").filter({ hasText: "详情" }).first().evaluate((el) => el.click());
  const dlg = page.locator(".el-dialog", { hasText: "证书详情" });
  await dlg.waitFor({ state: "visible", timeout: 15000 });
  for (let i = 0; i < 20; i++) {
    const t = await dlg.innerText();
    if (/有效期进度|申请订单/.test(t)) { console.log("detail loaded after", i * 300, "ms"); break; }
    await page.waitForTimeout(300);
  }
  console.log("detail text:", (await dlg.innerText()).replace(/\s+/g, " ").slice(0, 220));
  await dlg.locator("button", { hasText: "关闭" }).first().evaluate((el) => el.click());
  await page.waitForTimeout(500);

  // 下载
  await page.locator(".op-cell button.el-button:visible").filter({ hasText: "下载" }).first().evaluate((el) => el.click());
  const dl = page.locator(".el-dialog", { hasText: "下载证书" });
  await dl.waitFor({ state: "visible", timeout: 15000 });
  console.log("download items:", await dl.locator(".dlg-item").count());
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    dl.locator(".dlg-item").first().evaluate((el) => el.click()),
  ]);
  console.log("download suggestedFilename =", download.suggestedFilename());
  const p = await download.path();
  const fs = await import("node:fs");
  console.log("content head:", fs.readFileSync(p, "utf8").slice(0, 60).replace(/\n/g, "\\n"));
} catch (e) {
  console.log("PROBE2 ERROR:", e.message);
} finally {
  await browser.close();
}
