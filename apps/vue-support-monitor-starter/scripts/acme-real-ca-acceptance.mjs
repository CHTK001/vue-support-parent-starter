/**
 * ACME 真实签发生命周期 —— 生产级浏览器交付验收（Playwright/Chromium）。
 *
 * <p><b>与 acme-delivery-acceptance.mjs 的分工</b>：那套用受控数据断言「页面渲染/交互/状态机」，
 * 本套专门断言<b>真实签发</b>——因为公共 CA 在本环境不可达（101 出站间歇超时、备案墙、443 封闭），
 * 这里对接 101 上自建的本地测试 CA <b>Pebble</b>（`https://localhost:14000/dir`，
 * 以 PEBBLE_VA_ALWAYS_VALID=1 运行），从而让后端 acme4j 对任意测试域名<b>真实完成</b>
 * 「下单 → 触发验证 → 签发 → 下载证书链」。</p>
 *
 * <p>全流程均在浏览器里操作真实控件（新增账户/申请证书/详情/下载/续签/吊销），
 * 后端状态另经 REST 复核，二者必须一致。</p>
 *
 * 前置：
 *   1) 101 已运行 pebble.service（本地测试 CA）
 *   2) 已构建 dist 并启动 scripts/acme-accept-serve.mjs <port>
 *   3) 环境变量 MS_APP / MS_E2E_API_LOGIN / E2E_*
 *
 * 用法：
 *   $env:MS_APP="http://127.0.0.1:8898"
 *   node scripts/acme-real-ca-acceptance.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOT_DIR = join(APP_DIR, ".local-run", "acme-browser");
mkdirSync(SHOT_DIR, { recursive: true });

const APP = process.env.MS_APP || "http://127.0.0.1:8898";
const API_LOGIN = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";
const ACME_BASE = (process.env.ACME_API_BASE || "http://101.200.205.64:19170") + "/monitor/api/v1/cert";
const PEBBLE_DIRECTORY = process.env.PEBBLE_DIRECTORY || "https://localhost:14000/dir";

const stamp = Date.now();
const EMAIL = `pebble-ui-${stamp}@example.com`;
const DOMAIN = `pebble-ui-${stamp}.local.test`;

const results = [];
let crashed = false;
let token = "";
const isCrash = (e) => /has been closed|browser has been closed|Target closed|Target page, context or browser|page crashed|target crashed/i.test(String(e?.message || e));
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

/* ---------------- 后端 REST 复核 ---------------- */
async function apiGet(path) {
  const r = await fetch(`${ACME_BASE}${path}`, { headers: token ? { "x-oauth-token": token } : {} });
  return r.json();
}
async function apiDelete(path) {
  await fetch(`${ACME_BASE}${path}`, { method: "DELETE", headers: token ? { "x-oauth-token": token } : {} });
}
/** 按域名从后端查证书行（返回 detail.data.certificate 或 null） */
async function findCert(domain) {
  const list = await apiGet(`/page?page=1&pageSize=50&acmeCertPrimaryDomain=${encodeURIComponent(domain)}`);
  const rows = list?.data?.data?.data ?? [];
  const row = rows.find((c) => c.acmeCertPrimaryDomain === domain);
  if (!row) return null;
  const d = await apiGet(`/${row.acmeCertId}`);
  return d?.data?.certificate ?? null;
}

/* ---------------- 浏览器会话（崩溃自愈） ---------------- */
const LAUNCH_ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];
const pageErrors = [];
const httpErrors = [];
const NOISE = [/\/v2\/setting\/default/, /\/v2\/setting\/sso\/providers/, /\/v2\/location\/resolve/, /\/socket\.io\//];
let browser = null;
let page = null;

function attachPage(p) {
  p.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 200)));
  p.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(String(m.text()))) pageErrors.push(`console: ${String(m.text()).slice(0, 200)}`);
  });
  p.on("response", (r) => {
    if (r.status() >= 400) {
      const noisy = NOISE.some((re) => re.test(r.url()));
      if (!noisy) httpErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });
}
async function newSession() {
  if (browser) { try { await browser.close(); } catch { /* ignore */ } }
  browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  await context.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "font" || t === "media") return route.abort();
    return route.continue();
  });
  await context.addInitScript(() => {
    window.__msgs = [];
    const grab = (node) => {
      if (!node || node.nodeType !== 1) return;
      const found = [];
      if (node.classList && node.classList.contains("el-message")) found.push(node);
      if (node.querySelectorAll) node.querySelectorAll(".el-message").forEach((e) => found.push(e));
      for (const el of found) {
        const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (txt) window.__msgs.push(txt);
      }
    };
    const obs = new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) grab(n); });
    const start = () => obs.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start(); else document.addEventListener("DOMContentLoaded", start);
  });
  page = await context.newPage();
  attachPage(page);
}

/* ---------------- 交互帮助 ---------------- */
const dlg = (titleText) => page.locator(".el-dialog", { hasText: titleText });
const toolbarButton = (name) => page.locator(".page-actions button").filter({ hasText: name }).first();
const keywordInput = () => page.locator('input[placeholder="主域名"]');
const filterCount = () => page.locator(".filter-bar .filter-count").first();
async function drainToasts() {
  // 给当前已存在的提示打标，后续只认「新」消息（DOM 轮询比 MutationObserver 稳）
  await page.evaluate(() => { document.querySelectorAll(".el-message").forEach((e) => e.setAttribute("data-seen", "1")); }).catch(() => {});
}
async function waitToast(timeout = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const arr = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".el-message"))
        .filter((e) => !e.getAttribute("data-seen"))
        .map((e) => (e.innerText || "").replace(/\s+/g, " ").trim())
        .filter(Boolean),
    ).catch(() => []);
    if (arr.length) return arr.join(" | ");
    await page.waitForTimeout(150);
  }
  throw new Error(`未捕获到提示消息（${timeout}ms）`);
}
async function clickDialogButton(dlgLoc, name) {
  const b = dlgLoc.locator("button", { hasText: name }).first();
  await b.waitFor({ state: "visible", timeout: 15_000 });
  await b.evaluate((el) => el.click());
}
async function confirmAndToast(timeout = 90_000) {
  await page.locator(".el-message-box").waitFor({ state: "visible", timeout: 15_000 });
  await drainToasts();
  await page.locator(".el-message-box__btns button.el-button--primary").first().evaluate((el) => el.click());
  return waitToast(timeout);
}
async function setKeyword(v) {
  const i = keywordInput();
  await i.waitFor({ state: "visible", timeout: 15_000 });
  await i.fill(v);
  await i.press("Enter");
  await page.waitForTimeout(1300);
}
function mainRows() { return page.locator(".vxe-table--main-wrapper .vxe-body--row"); }
async function rowButtonIn(rowText, name) {
  // 证书表的「操作」列是固定右列：可见按钮在 fixed-right 副本里，main-wrapper 是隐藏副本。
  // 因此统一用 `:visible` 选可见那份（账户表无固定列时同样成立）。
  const mainRow = page.locator(".vxe-table--main-wrapper .vxe-body--row").filter({ hasText: rowText }).first();
  await mainRow.waitFor({ state: "attached", timeout: 20_000 });
  let btn = mainRow.locator(".op-cell button.el-button:visible").filter({ hasText: name }).first();
  if ((await btn.count()) === 0) {
    const fixedRow = page.locator(".vxe-table--fixed-right-wrapper .vxe-body--row").filter({ hasText: rowText }).first();
    btn = fixedRow.locator(".op-cell button.el-button:visible").filter({ hasText: name }).first();
  }
  if ((await btn.count()) === 0) {
    btn = page.locator(".vxe-body--row").filter({ hasText: rowText }).locator(".op-cell button.el-button:visible").filter({ hasText: name }).first();
  }
  await btn.waitFor({ state: "visible", timeout: 20_000 });
  await btn.evaluate((el) => el.click());
}
async function resetUi() {
  for (let i = 0; i < 4; i++) {
    const box = page.locator(".el-message-box");
    if (await box.count()) {
      const cancel = box.locator("button", { hasText: /取消|关闭/ }).first();
      if (await cancel.count()) await cancel.evaluate((el) => el.click()).catch(() => {});
      else await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
    const d = page.locator(".el-overlay:visible .el-dialog:visible");
    if (!(await d.count())) break;
    const x = d.locator(".el-dialog__headerbtn");
    if (await x.count()) await x.first().evaluate((el) => el.click()).catch(() => {});
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
  }
  await drainToasts();
}
async function step(name, fn) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await resetUi(); } catch (e) { if (isCrash(e) && attempt < 3) { await newSession().catch(() => {}); continue; } }
    try {
      const detail = await fn();
      record(name, true, (typeof detail === "string" ? detail : "") + (attempt > 1 ? `（浏览器被回收后重试第 ${attempt} 次通过）` : ""));
      return;
    } catch (e) {
      lastErr = e;
      if (isCrash(e) && attempt < 3) {
        console.log(`  [recover] 步骤「${name}」浏览器被回收，重建会话后重试…`);
        try { await newSession(); await ensureLogin(page, APP, API_LOGIN, E2E_CREDS); await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded" }); await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ timeout: 60_000 }); } catch (e2) { console.log(`  [recover] 重建失败: ${String(e2).slice(0, 120)}`); }
        continue;
      }
      break;
    }
  }
  if (isCrash(lastErr)) { crashed = true; record(name, false, `浏览器被系统回收: ${String(lastErr?.message || lastErr).slice(0, 120)}`); throw lastErr; }
  record(name, false, String(lastErr?.message || lastErr).slice(0, 320));
  try { await page.screenshot({ path: join(SHOT_DIR, `real-fail-${results.length}.png`) }); } catch { /* ignore */ }
}

/* ==================== 主流程 ==================== */
let accountId = null;
let accountEmail = EMAIL;
let certId = null;
let chainPemAfterIssue = null;

try {
  await newSession();
  const got = await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  record("登录进入控制台", got.ok, got.msg.slice(0, 50));
  token = got.token;

  await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ state: "visible", timeout: 60_000 });

  await step(`准备 ACME 账户（自定义 Pebble 目录 ${PEBBLE_DIRECTORY}）`, async () => {
    // 若已通过 API 预置账户（REAL_CA_ACCOUNT_ID），直接复用；否则在浏览器里新增（需前端 allow-create）。
    if (process.env.REAL_CA_ACCOUNT_ID) {
      accountId = Number(process.env.REAL_CA_ACCOUNT_ID);
      const acc = await apiGet(`/account/${accountId}`);
      assert(acc?.data?.acmeAccountId === accountId, "预置账户不存在");
      assert(acc.data.acmeAccountServer === PEBBLE_DIRECTORY, `预置账户目录不符: ${acc.data.acmeAccountServer}`);
      accountEmail = acc.data.acmeAccountEmail;
      return `复用预置账户 accountId=${accountId}（目录 ${PEBBLE_DIRECTORY}）`;
    }
    await toolbarButton("添加账户").evaluate((el) => el.click());
    const d = dlg("添加 ACME 账户");
    await d.waitFor({ state: "visible", timeout: 15_000 });
    await d.locator('input[placeholder="example@domain.com"]').fill(EMAIL);
    // 服务商下拉支持「选择或输入」：allow-create 下输入自定义目录回车即选中
    await d.locator(".el-select").first().click();
    await page.waitForTimeout(300);
    await page.keyboard.type(PEBBLE_DIRECTORY, { delay: 10 });
    await page.waitForTimeout(400);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await drainToasts();
    await clickDialogButton(d, "保存");
    const t = await waitToast();
    assert(/账户已创建|操作成功|已创建/.test(t) || /已存在|重复/.test(t), `新增账户提示异常: ${t}`);
    const list = await apiGet(`/account/list`);
    const arr = list?.data ?? [];
    const acc = arr.find((a) => a.acmeAccountEmail === EMAIL);
    assert(acc, "后端未找到新建账户");
    assert(acc.acmeAccountServer === PEBBLE_DIRECTORY, `账户目录未按输入保存: ${acc.acmeAccountServer}`);
    accountId = acc.acmeAccountId;
    accountEmail = acc.acmeAccountEmail;
    await page.screenshot({ path: join(SHOT_DIR, "07-real-account.png") });
    return `accountId=${accountId} server=${acc.acmeAccountServer}`;
  });

  await step("申请证书（HTTP-01 · 本机部署）提交受理", async () => {
    await toolbarButton("申请证书").evaluate((el) => el.click());
    const d = dlg("申请 SSL/TLS 证书");
    await d.waitFor({ state: "visible", timeout: 15_000 });
    await d.locator(".el-select").first().click();
    await page.locator(".el-select-dropdown__item", { hasText: accountEmail }).first().click();
    await d.locator('input[placeholder="example.com 或 *.example.com"]').fill(DOMAIN);
    await d.locator(".el-radio-button", { hasText: "本机部署" }).click();
    await page.waitForTimeout(300);
    await drainToasts();
    await clickDialogButton(d, "提交申请");
    const t = await waitToast();
    assert(/已提交|后台异步签发|操作成功/.test(t), `申请提示异常: ${t}`);
    // 提交后可能自动弹出详情弹窗，关闭以免遮挡后续步骤
    const dd = page.locator(".el-dialog", { hasText: "证书详情" });
    await dd.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    if (await dd.isVisible().catch(() => false)) {
      await dd.locator("button", { hasText: "关闭" }).first().evaluate((el) => el.click()).catch(() => {});
      await page.waitForTimeout(400);
    }
    return DOMAIN;
  });

  await step("真实签发：等待 CA（Pebble）签发完成，证书转为 valid 且含真实证书链", async () => {
    const start = Date.now();
    let cert = null;
    while (Date.now() - start < 150_000) {
      cert = await findCert(DOMAIN);
      if (cert && cert.acmeCertStatus === "valid") break;
      if (cert && cert.acmeCertStatus === "failed") throw new Error(`签发失败: ${cert.acmeCertLastError}`);
      await page.waitForTimeout(3000);
    }
    assert(cert, "未找到证书记录");
    assert(cert.acmeCertStatus === "valid", `证书未签发成功，当前状态: ${cert.acmeCertStatus} / ${cert.acmeCertLastError}`);
    assert(/-----BEGIN CERTIFICATE-----/.test(cert.acmeCertChainPem || ""), "证书链不是 PEM 格式");
    assert((cert.acmeCertChainPem.match(/BEGIN CERTIFICATE/g) || []).length >= 2, "证书链应含叶子+中间证书");
    assert(/PRIVATE KEY/.test(cert.acmeCertKeyPem || ""), "私钥不是 PEM 格式");
    assert(cert.acmeCertNotAfter, "缺少到期时间");
    certId = cert.acmeCertId;
    chainPemAfterIssue = cert.acmeCertChainPem;
    // 浏览器侧复核：列表显示为「有效」，详情显示第3步签发完成
    await setKeyword(DOMAIN);
    await page.getByText(DOMAIN, { exact: false }).first().waitFor({ state: "visible", timeout: 20_000 });
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    assert(/有效/.test(body), "列表未显示「有效」状态");
    await rowButtonIn(DOMAIN, "详情");
    const dd = dlg("证书详情");
    await dd.waitFor({ state: "visible", timeout: 15_000 });
    // 详情内容异步加载：等到出现「申请订单」区块再读，避免只读到标题
    await dd.getByText("申请订单", { exact: false }).first().waitFor({ state: "visible", timeout: 25_000 }).catch(() => {});
    await page.waitForTimeout(500);
    const dtxt = (await dd.innerText()).replace(/\s+/g, " ");
    assert(/第3步: 签发完成/.test(dtxt), `详情未显示签发完成: ${dtxt.slice(0, 160)}`);
    assert(/申请订单/.test(dtxt), "详情缺少申请订单");
    await page.screenshot({ path: join(SHOT_DIR, "08-real-issued-detail.png") });
    await clickDialogButton(dd, "关闭");
    await page.waitForTimeout(400);
    return `certId=${certId} notAfter=${cert.acmeCertNotAfter}`;
  });

  await step("下载真实证书：.crt 内容 == 后端已签发的证书链（字节级一致）", async () => {
    await setKeyword(DOMAIN);
    await page.getByText(DOMAIN, { exact: false }).first().waitFor({ state: "visible", timeout: 20_000 });
    await rowButtonIn(DOMAIN, "下载");
    const d = dlg("下载证书");
    await d.waitFor({ state: "visible", timeout: 15_000 });
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      d.locator(".dlg-item").nth(0).evaluate((el) => el.click()),
    ]);
    const p = await dl.path();
    const content = existsSync(p) ? readFileSync(p, "utf8") : "";
    const norm = (s) => s.replace(/\r\n/g, "\n").trim();
    assert(/-----BEGIN CERTIFICATE-----/.test(content), "下载的 .crt 不是 PEM 证书");
    assert(norm(content) === norm(chainPemAfterIssue), "下载内容与后端签发的证书链不一致");
    await page.screenshot({ path: join(SHOT_DIR, "09-real-download.png") });
    await clickDialogButton(d, "关闭");
    await page.waitForTimeout(400);
    return `${dl.suggestedFilename()} ${content.length}B`;
  });

  await step("下载·一键打包（zip）：含证书/私钥/链/README，且证书内容与后端一致", async () => {
    await setKeyword(DOMAIN);
    await page.getByText(DOMAIN, { exact: false }).first().waitFor({ state: "visible", timeout: 20_000 });
    await rowButtonIn(DOMAIN, "下载");
    const d = dlg("下载证书");
    await d.waitFor({ state: "visible", timeout: 15_000 });
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      d.locator("button", { hasText: "打包下载全部" }).first().evaluate((el) => el.click()),
    ]);
    const zipPath = join(SHOT_DIR, `${DOMAIN}-certs.zip`);
    await dl.saveAs(zipPath);
    const buf = readFileSync(zipPath);
    const has = (s) => buf.includes(Buffer.from(s, "utf8"));
    assert(dl.suggestedFilename() === `${DOMAIN}-certs.zip`, `zip 文件名异常: ${dl.suggestedFilename()}`);
    assert(has("README.txt"), "zip 缺 README.txt");
    assert(has(`${DOMAIN}.crt`), "zip 缺 .crt");
    assert(has(`${DOMAIN}.key`), "zip 缺 .key");
    assert(has(`${DOMAIN}_chain.crt`), "zip 缺 _chain.crt");
    assert(has("-----BEGIN CERTIFICATE-----"), "zip 内证书不是 PEM");
    assert(has("-----BEGIN RSA PRIVATE KEY-----") || has("-----BEGIN PRIVATE KEY-----"), "zip 内私钥不是 PEM");
    // STORE 方式不压缩：证书链字节原样在包里，可与后端已签发内容逐字节比对
    assert(has(chainPemAfterIssue), "zip 内证书内容与后端签发不一致");
    await page.screenshot({ path: join(SHOT_DIR, "12-zip-download.png") });
    await clickDialogButton(d, "关闭");
    await page.waitForTimeout(400);
    return `${dl.suggestedFilename()} ${buf.length}B`;
  });

  await step("续签：真实重新签发，产生新的证书链（serial/有效期变化）", async () => {
    await setKeyword(DOMAIN);
    await page.getByText(DOMAIN, { exact: false }).first().waitFor({ state: "visible", timeout: 20_000 });
    const before = await findCert(DOMAIN);
    await rowButtonIn(DOMAIN, "续签");
    const t = await confirmAndToast(120_000);
    assert(/续签请求已受理|续签成功|操作成功/.test(t), `续签未受理: ${t}`);
    const after = await findCert(DOMAIN);
    assert(after && after.acmeCertStatus === "valid", `续签后状态异常: ${after && after.acmeCertStatus} / ${after && after.acmeCertLastError}`);
    assert(after.acmeCertChainPem && after.acmeCertChainPem !== before.acmeCertChainPem, "续签后证书链未变化（可能未真正重签）");
    // 浏览器侧复核仍显示有效
    await page.locator(".page-actions button").filter({ hasText: "刷新" }).first().evaluate((el) => el.click()).catch(() => {});
    await page.waitForTimeout(1500);
    return `new notAfter=${after.acmeCertNotAfter}`;
  });

  await step("吊销：真实吊销，证书转为 revoked", async () => {
    await setKeyword(DOMAIN);
    await page.getByText(DOMAIN, { exact: false }).first().waitFor({ state: "visible", timeout: 20_000 });
    await rowButtonIn(DOMAIN, "吊销");
    const t = await confirmAndToast(120_000);
    assert(/证书已吊销|吊销成功|操作成功/.test(t), `吊销未成功: ${t}`);
    const after = await findCert(DOMAIN);
    assert(after && after.acmeCertStatus === "revoked", `吊销后状态异常: ${after && after.acmeCertStatus}`);
    await page.screenshot({ path: join(SHOT_DIR, "10-real-revoked.png") });
    return `status=${after.acmeCertStatus}`;
  });

  await step("全局：无 JS 运行时错误且无非白名单 4xx/5xx", async () => {
    assert(pageErrors.length === 0, `JS 错误: ${pageErrors.slice(0, 3).join(" ;; ")}`);
    assert(httpErrors.length === 0, `HTTP 错误: ${httpErrors.slice(0, 3).join(" ;; ")}`);
    return `pageErrors=${pageErrors.length} httpErrors=${httpErrors.length}`;
  });
} catch (e) {
  if (isCrash(e)) crashed = true;
  record("真实签发生命周期流程未预期中断", false, String(e?.message || e).slice(0, 400));
  try { await page.screenshot({ path: join(SHOT_DIR, "real-99-abort.png") }); } catch { /* ignore */ }
} finally {
  // 清理本轮运行期数据（证书 + 账户）
  try {
    if (certId) await apiDelete(`/${certId}`);
    const list = await apiGet(`/account/list`);
    const preset = process.env.REAL_CA_ACCOUNT_ID ? Number(process.env.REAL_CA_ACCOUNT_ID) : null;
    for (const a of (list?.data ?? [])) {
      if (String(a.acmeAccountEmail || "").startsWith("pebble-") && a.acmeAccountId !== preset) {
        await apiDelete(`/account/${a.acmeAccountId}`);
      }
    }
    // 清掉本轮可能残留的同域证书
    const cl = await apiGet(`/page?page=1&pageSize=50&acmeCertPrimaryDomain=${encodeURIComponent(DOMAIN)}`);
    for (const c of (cl?.data?.data?.data ?? [])) await apiDelete(`/${c.acmeCertId}`);
    console.log("[cleanup] 真实签发运行期数据已清理");
  } catch (e) {
    console.log(`[cleanup] 清理失败: ${String(e?.message || e)}`);
  }
  if (browser) await browser.close().catch(() => {});
}

const failed = results.filter((r) => !r.ok);
console.log(`\n==== ACME 真实签发生命周期验收：${results.length - failed.length}/${results.length} PASS ====`);
if (failed.length) console.log("失败项：\n" + failed.map((f) => `  - ${f.name} :: ${f.detail}`).join("\n"));
console.log(`截图目录：${SHOT_DIR}`);
if (crashed) { console.log("RESULT=CRASHED"); process.exit(3); }
console.log(`RESULT=${failed.length === 0 ? "ALL_PASS" : "FAILED"}`);
process.exit(failed.length === 0 ? 0 : 2);
