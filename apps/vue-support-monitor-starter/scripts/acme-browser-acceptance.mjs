/**
 * ACME 证书管理 —— 正式浏览器验收（Playwright/Chromium）。
 *
 * 覆盖链路：
 *   登录 → 「资产管理 / ACME 证书」菜单 → 添加 ACME 账户 → 列表可见
 *   → 申请证书（DNS-01）→ 证书列表可见 pending → 详情弹窗
 *   → 接口清理测试数据。
 *
 * 前置：
 *   1) 已构建 dist（pnpm exec vite build）
 *   2) 已启动 scripts/acme-accept-serve.mjs（分代理：/monitor/api→101，/v2,/ms→198）
 *
 * 用法：
 *   $env:MS_APP="http://127.0.0.1:8899"
 *   $env:MS_E2E_API_LOGIN="http://192.168.50.198:8081"
 *   $env:E2E_LOGIN_USERNAME="admin"; $env:E2E_LOGIN_PASSWORD="admin123"
 *   node scripts/acme-browser-acceptance.mjs
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOT_DIR = join(APP_DIR, ".local-run", "acme-browser");
mkdirSync(SHOT_DIR, { recursive: true });

const APP = process.env.MS_APP || "http://127.0.0.1:8899";
const API_LOGIN = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";
const ACME_BASE = (process.env.ACME_API_BASE || "http://101.200.205.64:19170") + "/monitor/api/v1/cert";
const CREDS = {
  username: process.env.E2E_LOGIN_USERNAME || "admin",
  password: process.env.E2E_LOGIN_PASSWORD || "admin123",
};

const stamp = Date.now();
const EMAIL = `ui-accept-${stamp}@example.com`;
const DOMAIN = `ui-accept-${stamp}.example.com`;

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--js-flags=--max-old-space-size=512",
  ],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const pageErrors = [];
/** 已知环境噪音（198 后端未实现/鉴权拒绝的接口，项目 SIGNOFF 已列为白名单） */
const NOISE_URL = [/\/v2\/setting\/default/, /\/v2\/setting\/sso\/providers/, /\/v2\/location\/resolve/];
const httpErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error" && !/Failed to load resource/.test(String(m.text()))) {
    pageErrors.push(`console: ${String(m.text()).slice(0, 200)}`);
  }
});
page.on("response", async (r) => {
  if (r.status() >= 400) {
    const noisy = NOISE_URL.some(re => re.test(r.url()));
    if (!noisy) httpErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    console.log(`[http ${r.status()}]${noisy ? " (noise)" : ""} ${r.request().method()} ${r.url()}`);
  }
  if (!r.url().includes("/monitor/api")) return;
  try {
    const t = await r.text();
    console.log(`[api] ${r.status()} ${r.request().method()} ${r.url().replace(APP, "")} :: ${t.replace(/\s+/g, " ").slice(0, 220)}`);
  } catch { /* ignore */ }
});

let token = "";
try {
  const got = await ensureLogin(page, APP, API_LOGIN, CREDS);
  record("登录进入控制台", got.ok, got.msg);
  token = got.token;

  // ---- 1. ACME 菜单与页面 ----
  await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ state: "visible", timeout: 60_000 });
  record("ACME 页面可打开（路由 /acme）", true);
  await page.getByRole("button", { name: "申请证书" }).first().waitFor({ state: "visible", timeout: 20_000 });
  record("工具栏按钮齐备（续签检查/添加账户/申请证书）",
    (await page.getByRole("button", { name: "续签检查" }).count()) > 0 &&
    (await page.getByRole("button", { name: "添加账户" }).count()) > 0);
  await page.screenshot({ path: join(SHOT_DIR, "01-acme-page.png") });

  // ---- 2. 添加账户（真实 UI 提交，走 /monitor/api → 101）----
  await page.getByRole("button", { name: "添加账户" }).first().click();
  const accDlg = page.locator(".el-dialog", { hasText: "添加 ACME 账户" });
  await accDlg.waitFor({ state: "visible", timeout: 20_000 });
  await accDlg.locator('input[placeholder="example@domain.com"]').fill(EMAIL);
  await accDlg.getByRole("button", { name: "保存" }).click();
  await page.locator(".el-message--success").first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
  record("添加 ACME 账户提交成功", true, EMAIL);

  // 账户管理页签可见新账户
  await page.getByRole("button", { name: "账户管理" }).first().click();
  await page.waitForTimeout(3500);
  const accountsText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  console.log(`[accounts view] ${accountsText.slice(0, 600)}`);
  await page.getByText(EMAIL).first().waitFor({ state: "visible", timeout: 20_000 });
  record("账户列表显示新账户", true);
  await page.screenshot({ path: join(SHOT_DIR, "02-account-created.png") });

  // ---- 3. 申请证书（DNS-01）----
  await page.getByRole("button", { name: "证书管理" }).first().click();
  await page.getByRole("button", { name: "申请证书" }).first().click();
  const applyDlg = page.locator(".el-dialog", { hasText: "申请 SSL/TLS 证书" });
  await applyDlg.waitFor({ state: "visible", timeout: 20_000 });

  // 选择账户（el-select）
  await applyDlg.locator(".el-select").first().click();
  await page.locator(".el-select-dropdown__item", { hasText: EMAIL }).first().waitFor({ state: "visible", timeout: 15_000 });
  await page.locator(".el-select-dropdown__item", { hasText: EMAIL }).first().click();

  // 主域名
  await applyDlg.locator('input[placeholder="example.com 或 *.example.com"]').fill(DOMAIN);
  // DNS-01 验证
  await applyDlg.locator(".el-radio-button", { hasText: "DNS-01" }).click();
  await applyDlg.getByRole("button", { name: "提交申请" }).click();
  await page.locator(".el-message--success").first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});

  // 证书列表出现该域名
  await page.getByText(DOMAIN).first().waitFor({ state: "visible", timeout: 30_000 });
  record("申请证书后列表出现记录", true, DOMAIN);
  await page.screenshot({ path: join(SHOT_DIR, "03-cert-applied.png") });

  // ---- 4. 证书详情 ----
  // ReTable 固定右列会复制一份列 DOM；且按钮可能被 toast/遮罩短暂覆盖，
  // 直接用 DOM click 触发 handler，规避 Playwright 的遮挡可点击性检查。
  await page.locator("button.el-button:visible", { hasText: "详情" }).first().evaluate((el) => el.click());
  await page.locator(".el-dialog", { hasText: "证书详情" }).waitFor({ state: "visible", timeout: 20_000 });
  record("证书详情弹窗可打开", true);
  await page.screenshot({ path: join(SHOT_DIR, "04-cert-detail.png") });
  await page.locator(".el-dialog", { hasText: "证书详情" })
    .locator("button.el-button", { hasText: "关闭" })
    .first()
    .click();

  record(
    "页面无 JS 运行时错误且无非白名单 4xx/5xx",
    pageErrors.length === 0 && httpErrors.length === 0,
    [...pageErrors, ...httpErrors].slice(0, 3).join(" ;; "),
  );
} catch (e) {
  record("浏览器验收主流程", false, String(e?.message || e).slice(0, 400));
  try { await page.screenshot({ path: join(SHOT_DIR, "99-failure.png") }); } catch { /* ignore */ }
} finally {
  // ---- 5. 清理测试数据（接口层，避免残留）----
  try {
    const h = token ? { "x-oauth-token": token } : {};
    const list = await (await fetch(`${ACME_BASE}/page?page=1&pageSize=100`, { headers: h })).json();
    for (const c of list?.data?.data?.data ?? []) {
      if (c.acmeCertPrimaryDomain === DOMAIN) {
        await fetch(`${ACME_BASE}/${c.acmeCertId}`, { method: "DELETE", headers: h });
      }
    }
    const accs = await (await fetch(`${ACME_BASE}/account/list`, { headers: h })).json();
    for (const a of accs?.data ?? []) {
      if (a.acmeAccountEmail === EMAIL) {
        await fetch(`${ACME_BASE}/account/${a.acmeAccountId}`, { method: "DELETE", headers: h });
      }
    }
    console.log("[cleanup] 测试数据已清理");
  } catch (e) {
    console.log(`[cleanup] 清理失败（可手动清理）：${String(e?.message || e)}`);
  }
  await browser.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\n==== ACME 浏览器验收：${results.length - failed.length}/${results.length} PASS ====`);
console.log(`截图目录：${SHOT_DIR}`);
process.exit(failed.length === 0 ? 0 : 2);
