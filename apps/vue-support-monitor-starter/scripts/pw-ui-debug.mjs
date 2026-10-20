/**
 * 临时调试：截图 CreateTableDialog 与 BulkImportDialog 的新 UI。
 */
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:8851";
const STATE = "tests/e2e/.auth/user-monitor.json";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE,
    storageState: STATE,
    viewport: { width: 1500, height: 950 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/index.html#/db-manager`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator(".dbm-tree-node").first().waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(1200);
  const dbNode = page.locator(".dbm-tree-node", { has: page.locator(".dbm-db-icon") }).first();
  await dbNode.click({ button: "right", timeout: 10_000 });
  await page.waitForTimeout(600);
  const create = page.locator(".dbm-context-menu .dbm-context-item").filter({ hasText: "新建表" }).first();
  await create.click({ timeout: 10_000 });
  await page.locator(".ct-grid").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "create-table-dialog-new.png", fullPage: false });
  console.log("create table screenshot saved");

  await page.goto(`${BASE}/index.html#/sync-tasks`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator(".st-page-title").waitFor({ state: "visible", timeout: 30_000 });
  const btn = page.locator(".el-button").filter({ hasText: "批量导入" }).first();
  await btn.click({ timeout: 15_000 });
  await page.locator(".bi-steps").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "bulk-import-dialog-new.png", fullPage: false });
  console.log("bulk import screenshot saved");

  await browser.close();
}

main().catch(e => {
  console.error("DEBUG_FAIL", e?.message || e);
  process.exit(1);
});
