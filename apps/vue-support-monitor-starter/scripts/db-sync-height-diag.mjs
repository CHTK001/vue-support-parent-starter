/**
 * 结构同步四步等高诊断：实测每个视图 .el-dialog__body / .el-dialog 高度 + 截图
 * 用于排查「四步等高」断言 FAIL（diff=849 / deploy=173 异常值）
 */
import { chromium } from "playwright";
import { ensureLogin } from "./ui-login.mjs";
import { resolveCreds } from "./login-cred.mjs";

const APP = process.argv[2] || process.env.MS_APP || "http://localhost:8861";
const API = process.env.MS_E2E_API || "http://192.168.50.198:8112";
const DB = "jdbc_acc";
const DS = 11;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
page.setDefaultTimeout(60000);

const out = [];
const measure = async (label) => {
  const data = await page.evaluate(() => {
    const dlg = document.querySelector(".dbm-sync-dialog");
    if (!dlg) return { dlg: null };
    const body = dlg.querySelector(".el-dialog__body");
    const d = dlg.querySelector(".el-dialog");
    return {
      body: body ? { h: body.getBoundingClientRect().height, y: body.getBoundingClientRect().y, scrollH: body.scrollHeight } : null,
      dlg: d ? { h: d.getBoundingClientRect().height, y: d.getBoundingClientRect().y } : null,
    };
  });
  const line = `${label}: body=${data.body ? `${Math.round(data.body.h)}px(y=${Math.round(data.body.y)},scrollH=${data.body.scrollH})` : "none"} dlg=${data.dlg ? `${Math.round(data.dlg.h)}px` : "none"}`;
  out.push(line);
  console.log("  " + line);
  await page.screenshot({ path: `C:/Users/Administrator/AppData/Local/Temp/opencode/sync-${label}.png` });
};

try {
  const creds = await resolveCreds(API);
  const login = await ensureLogin(page, APP, API, creds);
  if (!login.ok) process.exit(2);
  await page.goto(`${APP}/#/db-manager?datasourceId=${DS}`, { waitUntil: "domcontentloaded" });
  await page.locator(".dbm-toolbar").first().waitFor({ timeout: 120000 });
  await sleep(5000);

  const dbNode = page.getByText(DB, { exact: true }).first();
  await dbNode.click({ button: "right" });
  await sleep(1000);
  await page.locator('.dbm-context-item:has-text("结构同步")').first().click();
  await sleep(1500);
  const dialog = page.locator(".dbm-sync-dialog").first();
  await measure("1-select");

  await dialog.locator(".dbm-sync-foot .el-button").filter({ hasText: "比较" }).first().click();
  await sleep(600);
  await measure("1b-compare");
  await sleep(2500);
  for (let i = 0; i < 15; i++) {
    if ((await dialog.locator(".dbm-sync-groups").count()) > 0) break;
    await sleep(800);
  }
  await sleep(500);
  await measure("2-diff");

  await dialog.locator(".dbm-sync-foot .el-button").filter({ hasText: "下一步" }).first().click();
  await sleep(800);
  await measure("3-deploy-script");

  const tabScript = dialog.locator(".dbm-sync-tab").filter({ hasText: "部署脚本" }).first();
  if (await tabScript.count() > 0) await tabScript.click();
  await sleep(300);
  await measure("3b-deploy-script-again");

  const logTab = dialog.locator(".dbm-sync-tab").filter({ hasText: "消息日志" }).first();
  await logTab.click();
  await sleep(300);
  await measure("3c-deploy-log");

  console.log("\n" + out.join("\n"));
} catch (e) {
  console.log("ERR " + String((e && e.stack || e.message || e)).slice(0, 400));
}
await browser.close();