// 快速 dump：.dbm-sync-dialog 的实际 DOM 结构与 class 落点
import { chromium } from "playwright";
import { ensureLogin } from "./ui-login.mjs";
import { resolveCreds } from "./login-cred.mjs";

const APP = process.argv[2] || "http://localhost:8861";
const API = process.env.MS_E2E_API || "http://192.168.50.198:8112";
const DB = "jdbc_acc";
const DS = 11;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
page.setDefaultTimeout(60000);
try {
  const creds = await resolveCreds(API);
  const login = await ensureLogin(page, APP, API, creds);
  if (!login.ok) process.exit(2);
  await page.goto(`${APP}/#/db-manager?datasourceId=${DS}`, { waitUntil: "domcontentloaded" });
  await page.locator(".dbm-toolbar").first().waitFor({ timeout: 120000 });
  await sleep(5000);
  await page.getByText(DB, { exact: true }).first().click({ button: "right" });
  await sleep(1000);
  await page.locator('.dbm-context-item:has-text("结构同步")').first().click();
  await sleep(1500);
  const d = await page.evaluate(() => {
    const el = document.querySelector(".dbm-sync-dialog");
    if (!el) return { found: false };
    return {
      found: true,
      tag: el.tagName,
      cls: el.className,
      hasDialog: !!el.querySelector(".el-dialog"),
      hasBody: !!el.querySelector(".el-dialog__body"),
      hasOverlay: !!el.closest(".el-overlay"),
      outerStart: el.outerHTML.slice(0, 400),
    };
  });
  console.log(JSON.stringify(d, null, 2));
  // 检查 scoped CSS 是否真的写进 dom：找包含 dbm-sync-dialog 的样式
  const st = await page.evaluate(() => {
    const out = [];
    for (const ss of document.styleSheets) {
      try {
        for (const r of ss.cssRules) {
          if (r.selectorText && r.selectorText.includes("dbm-sync-dialog") && r.selectorText.includes("el-dialog__body")) {
            out.push(r.selectorText + " {" + r.style.cssText.slice(0, 200) + "}");
          }
        }
      } catch { /* ignore */ }
    }
    return out.slice(0, 10);
  });
  console.log("BODY-RULES:\n" + st.join("\n"));
} catch (e) {
  console.log("ERR " + String(e && e.message || e).slice(0, 300));
}
await browser.close();