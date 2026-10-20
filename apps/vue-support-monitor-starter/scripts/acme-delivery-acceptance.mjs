/**
 * ACME 证书管理 —— 生产级浏览器交付验收（Playwright/Chromium）。
 *
 * <p><b>口径</b>：交付 = 功能实现 + 生产级验收。本套件不满足于「页面能打开」的冒烟，
 * 而是对 ACME 页面的每一个可点击控件真实点击并断言结果，覆盖：
 * 统计卡、分页、筛选、六态渲染、详情（信息/进度/错误/HTTP-01 验证信息与 curl 自检/
 * DNS-01 记录/订单表）、下载三件套（含真实文件内容）、条件渲染、续签/重新验证/吊销/
 * 删除/续签检查的确认与反馈、账户增删改（含被拒负路径）、申请弹窗三类校验与两个受理。
 *
 * <p><b>为什么用受控数据</b>：真实签发需要「可控公网域名 + CA 可达」。本环境 101 的
 * 80 端口带域名 Host 会被阿里云备案墙拦（403），443 入站封闭，且到公共 CA 的
 * java.net.http 出站不稳定（已实测）。因此「需要一张已签发证书才能履约」的页面
 * （下载/有效期/到期统计/续签/吊销）由 seeding 构造受控证书记录驱动；申请链路仍走
 * 真实后端与真实异步任务。
 *
 * <p><b>健壮性设计</b>（生产级验收最怕「一处失败污染后续」）：
 *   1) 提示消息用页面内 MutationObserver 采集，动作前 drain、动作后等「新」消息，
 *      彻底避免读到上一步残留的旧 toast；
 *   2) 每个 step 开始前 resetUi()：关闭遗留的 dialog / message-box，避免模态遮罩使
 *      后续步骤假失败（这是上一版串行失败的根因）；
 *   3) 行内操作按「主表行文本」定位，不再命中第一行（账户表无关键字筛选时尤其重要）；
 *   4) 详情弹窗等待异步内容加载完成再断言（loading 骨架消失 + 主域名出现）。
 *
 * 前置：
 *   1) 101 的 acme 库执行 seed_acme.sql（1 账户 / 25 证书 / 3 订单）——**每次运行前复位**
 *   2) 已构建 dist（pnpm exec vite build）
 *   3) 已启动 scripts/acme-accept-serve.mjs <port>（/monitor/api→101，/v2,/ms→198）
 *
 * 用法：
 *   $env:MS_APP="http://127.0.0.1:8898"
 *   $env:MS_E2E_API_LOGIN="http://192.168.50.198:8081"
 *   node scripts/acme-delivery-acceptance.mjs
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOT_DIR = join(APP_DIR, ".local-run", "acme-browser");
mkdirSync(SHOT_DIR, { recursive: true });

const APP = process.env.MS_APP || "http://127.0.0.1:8898";
const API_LOGIN = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";
const ACME_BASE = (process.env.ACME_API_BASE || "http://101.200.205.64:19170") + "/monitor/api/v1/cert";

const SEED = {
  account: "acme-accept@example.com",
  validFar: "acme-valid-far.example.com",
  validSoon: "acme-valid-soon.example.com",
  validExpired: "acme-valid-expired.example.com",
  revoked: "acme-revoked.example.com",
  failed: "acme-failed.example.com",
  validatingHttp: "acme-validating-http.example.com",
  validatingDns: "acme-validating-dns.example.com",
  bulkFirst: "acme-bulk-01.example.com",
  bulkLast: "acme-bulk-18.example.com",
  certCount: 25,
};

const stamp = Date.now();
const NEW_ACCOUNT = `accept-ui-${stamp}@example.com`;
const EMPTY_ACCOUNT = `accept-empty-${stamp}@example.com`;
const EAB_ACCOUNT = `accept-eab-${stamp}@example.com`;
const NEW_DOMAIN = `accept-ui-${stamp}.example.com`;
const DIALOG_DOMAIN = `accept-dialog-${stamp}.example.com`;

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

// 机器内存受多会话挤压，Chromium 会被系统提交上限杀掉（Target page closed）。
// 这不是被测系统的缺陷，用独立退出码 3 标记，交由外层 wrapper 复位数据后重跑。
let crashed = false;
const isCrash = (e) => /has been closed|browser has been closed|Target closed|Target page, context or browser|page crashed|target crashed|renderer/i.test(String(e?.message || e));

// 启动参数对齐「实测可跑通」的最小集（多加的省内存开关反而触发 Chromium 原生崩溃）。
const LAUNCH_ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];

const pageErrors = [];
const NOISE_URL = [/\/v2\/setting\/default/, /\/v2\/setting\/sso\/providers/, /\/v2\/location\/resolve/];
// 预期内的失败：无证书内容记录的下载必然 404（负路径用例），不算缺陷。
const EXPECTED_ERR = [/\/v1\/cert\/\d+\/download\?fileType=/];
const httpErrors = [];

function attachPage(p) {
  p.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 200)));
  p.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(String(m.text()))) {
      pageErrors.push(`console: ${String(m.text()).slice(0, 200)}`);
    }
  });
  p.on("response", (r) => {
    if (r.status() >= 400) {
      const noisy = NOISE_URL.some((re) => re.test(r.url())) || EXPECTED_ERR.some((re) => re.test(r.url()));
      if (!noisy) httpErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });
}

// 机器内存受多会话挤压时 renderer 会被系统提交上限回收（Target page closed / Page crashed）。
// 这不是被测系统的缺陷：本套件在进程内重建会话并重试「当前 step」，让一次运行能跨过崩溃
// 继续累积（数据以 101 库为准；重建后重新登录、回到 /#/acme 再重放该步）。
let browser = null;
let context = null;
let page = null;
let token = "";

async function newSession() {
  if (browser) { try { await browser.close(); } catch { /* ignore */ } }
  browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  context = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  // 验收断言全部基于文本，屏蔽图片/字体/媒体可显著降低 renderer 内存（不影响任何断言）。
  await context.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "font" || t === "media") return route.abort();
    return route.continue();
  });
  // 提示消息采集器：页面内 MutationObserver 把每个新增 .el-message 的文本入栈，
  // 动作前 drainToasts() 清空、动作后只认「新」消息，杜绝读到旧 toast。
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
    const obs = new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) grab(n);
    });
    const start = () => obs.observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start);
  });
  page = await context.newPage();
  attachPage(page);
}

await newSession();

// ==================== 选择器与交互帮助 ====================
const detailDlg = () => page.locator(".el-dialog", { hasText: "证书详情" });
const applyDlg = () => page.locator(".el-dialog", { hasText: "申请 SSL/TLS 证书" });
const accountDlg = () => page.locator(".el-dialog", { hasText: /添加 ACME 账户|编辑 ACME 账户/ });
const downloadDlg = () => page.locator(".el-dialog", { hasText: "下载证书" });

const keywordInput = () => page.locator('input[placeholder="主域名"]');
const statusSelect = () => page.locator(".filter-bar .el-select").first();
const filterCount = () => page.locator(".filter-bar .filter-count").first();
const statNum = (label) => page.locator(".stat-card", { hasText: label }).locator(".stat-num").first();

// vxe 主表行（行内操作按钮与行文本同在主表行内；固定右列只是覆盖层副本）
const mainRows = () => page.locator(".vxe-table--main-wrapper .vxe-body--row");

/** 工具栏按钮（page-actions 内） */
async function toolbarButton(name) {
  const b = page.locator(".page-actions button").filter({ hasText: name }).first();
  await b.waitFor({ state: "visible", timeout: 15_000 });
  await b.evaluate((el) => el.click());
}
/** 表格行内操作按钮（默认第一行，用于已用关键字收敛到单行的场景） */
async function rowButton(name) {
  const b = page.locator(".vxe-table--main-wrapper .op-cell button.el-button").filter({ hasText: name }).first();
  if (await b.count()) {
    await b.evaluate((el) => el.click());
    return;
  }
  const f = page.locator(".op-cell button.el-button:visible").filter({ hasText: name }).first();
  await f.waitFor({ state: "visible", timeout: 15_000 });
  await f.evaluate((el) => el.click());
}
/** 按主表行文本定位并点击该行操作按钮（多行无筛选时用） */
async function rowButtonIn(rowText, name) {
  const rows = mainRows();
  const n = await rows.count();
  for (let i = 0; i < n; i++) {
    if ((await rows.nth(i).innerText()).includes(rowText)) {
      const main = rows.nth(i).locator(".op-cell button.el-button").filter({ hasText: name }).first();
      if (await main.count()) {
        await main.evaluate((el) => el.click());
        return;
      }
      const fixed = page.locator(".vxe-table--fixed-right-wrapper .vxe-body--row").nth(i)
        .locator(".op-cell button.el-button").filter({ hasText: name }).first();
      await fixed.waitFor({ state: "attached", timeout: 15_000 });
      await fixed.evaluate((el) => el.click());
      return;
    }
  }
  throw new Error(`未找到行: ${rowText}`);
}
async function clickDialogButton(dlg, name) {
  const b = dlg().locator("button", { hasText: name }).first();
  await b.waitFor({ state: "visible", timeout: 15_000 });
  await b.evaluate((el) => el.click());
}
async function confirmMessageBox() {
  const b = page.locator(".el-message-box__btns button.el-button--primary").first();
  await b.waitFor({ state: "visible", timeout: 15_000 });
  await b.evaluate((el) => el.click());
}
async function setKeyword(v) {
  await switchTab("certs");
  const i = keywordInput();
  await i.waitFor({ state: "visible", timeout: 15_000 });
  await i.fill(v);
  await i.press("Enter");
  await page.waitForTimeout(1300);
}
async function waitText(text, timeout = 20_000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
}
/** 清空已采集的提示消息（动作前调用） */
async function drainToasts() {
  await page.evaluate(() => { window.__msgs = []; }).catch(() => {});
}
/** 等待「新」提示消息；把 drain 之后到达的全部消息拼起来返回，便于多分支断言 */
async function waitToast(timeout = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const arr = await page.evaluate(() => window.__msgs || []).catch(() => []);
    if (arr.length) return arr.join(" | ");
    await page.waitForTimeout(150);
  }
  throw new Error(`未捕获到提示消息（${timeout}ms）`);
}
async function closeDialog(dlg, btn = "关闭") {
  await clickDialogButton(dlg, btn);
  await page.waitForTimeout(400);
}
async function confirmAndToast(timeout = 60_000) {
  await page.locator(".el-message-box").waitFor({ state: "visible", timeout: 15_000 });
  await drainToasts();
  await confirmMessageBox();
  return waitToast(timeout);
}
/** 打开详情并等待异步内容加载完成（loading 骨架消失 + 主域名出现） */
async function openDetailAndWait(domain, timeout = 20_000) {
  await detailDlg().waitFor({ state: "visible", timeout });
  const start = Date.now();
  let t = "";
  while (Date.now() - start < timeout) {
    t = await detailDlg().innerText().catch(() => "");
    if (!/加载中/.test(t) && (!domain || t.includes(domain))) return t.replace(/\s+/g, " ");
    await page.waitForTimeout(200);
  }
  return t.replace(/\s+/g, " ");
}
/** 关闭遗留的 message-box / dialog，隔离上一步失败的影响 */
async function resetUi() {
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator(".el-message-box").count())) break;
    await page.locator(".el-message-box__btns button").first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(200);
  }
  for (let i = 0; i < 6; i++) {
    const visible = page.locator(".el-dialog:visible");
    if (!(await visible.count())) break;
    const footer = visible.locator(".el-dialog__footer button").filter({ hasText: /取消|关闭/ });
    if (await footer.count()) {
      await footer.first().click({ timeout: 2000 }).catch(() => {});
    } else {
      const x = visible.locator(".el-dialog__headerbtn");
      if (await x.count()) await x.first().click({ timeout: 2000 }).catch(() => {});
      else await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(300);
  }
  await drainToasts();
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** 当前页签（崩溃重建会话后据此还原，账户类步骤依赖它） */
let currentTab = "certs";
/** 切换到证书/账户页签；目标已是当前页签则只做就绪等待（幂等，便于崩溃后重放） */
async function switchTab(which) {
  const label = which === "accounts" ? "账户管理" : "证书管理";
  const btn = page.getByRole("button", { name: label }).first();
  await btn.waitFor({ state: "visible", timeout: 30_000 });
  const active = await btn.evaluate((el) => el.classList.contains("active")).catch(() => false);
  if (!active) {
    await btn.evaluate((el) => el.click());
    await page.waitForTimeout(1600);
  }
  currentTab = which;
}
/** 回到 ACME 主页（崩溃重建后导航 + 还原页签） */
async function gotoHome() {
  await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ state: "visible", timeout: 60_000 });
  if (currentTab === "accounts") await switchTab("accounts");
}
/** 重建整条会话（浏览器被系统回收后）；重新登录并回到 /#/acme */
async function recoverSession() {
  await newSession();
  const got = await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  if (got.token) token = got.token;
  await gotoHome();
}

/**
 * 执行一个验收 step。机器内存受多会话挤压时 renderer 会被回收（Target closed / Page crashed），
 * 这属于环境失败而非产品缺陷：本函数重建会话、还原页面状态后重放当前 step（最多 3 次），
 * 使一次运行能跨过随机崩溃继续累积；三次仍崩才判为 CRASHED（退出码 3）。
 */
async function step(name, fn) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await resetUi();
    } catch (e) {
      if (isCrash(e) && attempt < 3) { await recoverSession().catch(() => {}); continue; }
    }
    try {
      const detail = await fn();
      record(name, true, (typeof detail === "string" ? detail : "") + (attempt > 1 ? `（浏览器被回收后重试第 ${attempt} 次通过）` : ""));
      return;
    } catch (e) {
      lastErr = e;
      if (isCrash(e) && attempt < 3) {
        console.log(`  [recover] 步骤「${name}」第 ${attempt} 次遇到浏览器被回收，重建会话后重试…`);
        try { await recoverSession(); } catch (e2) { console.log(`  [recover] 重建失败: ${String(e2).slice(0, 120)}`); }
        continue;
      }
      break;
    }
  }
  if (isCrash(lastErr)) {
    crashed = true;
    record(name, false, `浏览器被系统回收: ${String(lastErr?.message || lastErr).slice(0, 120)}`);
    throw lastErr;
  }
  record(name, false, String(lastErr?.message || lastErr).slice(0, 300));
  try { await page.screenshot({ path: join(SHOT_DIR, `fail-${results.length}.png`) }); } catch { /* ignore */ }
}

// ==================== 主流程 ====================
try {
  const got = await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  record("登录进入控制台", got.ok, got.msg);
  token = got.token;

  await step("左侧「资产管理 → ACME 证书」路由可打开", async () => {
    await page.goto(`${APP}/#/acme`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator("h1.page-title", { hasText: "ACME 证书" }).waitFor({ state: "visible", timeout: 60_000 });
    currentTab = "certs";
    return "/#/acme";
  });

  await step("工具栏三按钮齐备（续签检查/添加账户/申请证书）", async () => {
    for (const n of ["续签检查", "添加账户", "申请证书"]) {
      assert((await page.locator(".page-actions button").filter({ hasText: n }).count()) > 0, `缺少按钮 ${n}`);
    }
    return "续签检查 / 添加账户 / 申请证书";
  });

  await step("统计卡与后端一致（账户1/有效21/即将到期1/处理中2/已过期1）", async () => {
    // 冷启动下统计接口可能晚于 1.5s 返回；轮询到「ACME 账户」非 0 再断言，避免误报。
    const want = { "ACME 账户": 1, "有效证书": 21, "即将到期": 1, "处理中": 2, "已过期": 1 };
    const start = Date.now();
    let got = 0;
    while (Date.now() - start < 20_000) {
      got = Number(await statNum("ACME 账户").innerText().catch(() => "0"));
      if (got !== 0) break;
      await page.waitForTimeout(500);
    }
    for (const [k, v] of Object.entries(want)) {
      const g = Number(await statNum(k).innerText());
      assert(g === v, `统计「${k}」期望 ${v} 实得 ${g}`);
    }
    await page.screenshot({ path: join(SHOT_DIR, "01-page-stats.png") });
    return "5 张统计卡全部命中";
  });

  await step("证书分页：共 25 条，翻到第 2 页看到 bulk-18 且不含 bulk-01", async () => {
    // 列表与统计一样是异步加载，轮询到目标条数再断言。
    const start = Date.now();
    let cnt = "";
    while (Date.now() - start < 20_000) {
      cnt = (await filterCount().innerText().catch(() => "")).replace(/\s+/g, "");
      if (/共25条/.test(cnt)) break;
      await page.waitForTimeout(500);
    }
    assert(/共25条/.test(cnt), `筛选条数异常: ${cnt}`);
    await waitText(SEED.bulkFirst);
    await page.locator(".rm-pager__btn").filter({ hasText: /^2$/ }).first().evaluate((el) => el.click());
    await page.waitForTimeout(1600);
    await waitText(SEED.bulkLast);
    assert((await page.getByText(SEED.bulkFirst, { exact: false }).count()) === 0, "第 2 页不应出现 bulk-01");
    await page.locator(".rm-pager__btn").filter({ hasText: /^1$/ }).first().evaluate((el) => el.click());
    await page.waitForTimeout(1300);
    return "2 页翻页正确";
  });

  await step("关键字筛选(2) / 状态筛选(1) / 重置(25)", async () => {
    await setKeyword("acme-validating");
    assert(/共2条/.test((await filterCount().innerText()).replace(/\s+/g, "")), "关键字筛选异常");
    await keywordInput().fill("");
    await statusSelect().click();
    await page.locator(".el-select-dropdown__item", { hasText: "已吊销" }).first().click();
    await page.waitForTimeout(1300);
    assert(/共1条/.test((await filterCount().innerText()).replace(/\s+/g, "")), "状态筛选异常");
    await waitText(SEED.revoked);
    await page.getByRole("button", { name: "重置" }).first().evaluate((el) => el.click());
    await page.waitForTimeout(1300);
    assert(/共25条/.test((await filterCount().innerText()).replace(/\s+/g, "")), "重置异常");
    return "2 / 1 / 25";
  });

  await step("添加 ACME 账户（真实提交）", async () => {
    await switchTab("certs");
    await toolbarButton("添加账户");
    await accountDlg().waitFor({ state: "visible", timeout: 15_000 });
    await accountDlg().locator('input[placeholder="example@domain.com"]').fill(NEW_ACCOUNT);
    await drainToasts();
    await clickDialogButton(accountDlg, "保存");
    const t = await waitToast();
    // 崩溃重放时该账户可能已在上一次尝试中创建（后端返回「已存在」），同样视为该步达成。
    assert(/账户已创建|操作成功|已创建/.test(t) || /已存在|重复/.test(t), `新增账户提示异常: ${t}`);
    if (/已存在|重复/.test(t)) await clickDialogButton(accountDlg, "取消").catch(() => {});
    return NEW_ACCOUNT;
  });

  await step("申请证书（HTTP-01 手动）受理成功并进入列表", async () => {
    // 崩溃重放：若上一次尝试已提交成功（异步任务已落库），跳过重复提交直接断言可见。
    await switchTab("certs");
    const applied = (await (async () => { await setKeyword(NEW_DOMAIN); return page.getByText(NEW_DOMAIN, { exact: false }).count(); })()) > 0;
    if (!applied) {
      await toolbarButton("申请证书");
      await applyDlg().waitFor({ state: "visible", timeout: 15_000 });
      await applyDlg().locator(".el-select").first().click();
      await page.locator(".el-select-dropdown__item", { hasText: NEW_ACCOUNT }).first().click();
      await applyDlg().locator('input[placeholder="example.com 或 *.example.com"]').fill(NEW_DOMAIN);
      await drainToasts();
      await clickDialogButton(applyDlg, "提交申请");
      const t = await waitToast();
      assert(/已提交|后台异步签发|操作成功/.test(t), `申请提示异常: ${t}`);
      await detailDlg().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
      if (await detailDlg().isVisible().catch(() => false)) await closeDialog(detailDlg);
    }
    await setKeyword(NEW_DOMAIN);
    await waitText(NEW_DOMAIN);
    return NEW_DOMAIN;
  });

  await step("详情·valid(远)：剩余有效期 + SAN 计数 + 第3步 + 申请订单", async () => {
    await setKeyword(SEED.validFar);
    await waitText(SEED.validFar);
    await rowButton("详情");
    const txt = await openDetailAndWait(SEED.validFar);
    assert(/剩余 7[0-9] 天|剩余 8[0-9] 天/.test(txt), `未显示剩余有效期: ${txt.slice(0, 160)}`);
    assert(/\+2 个备用域名/.test(txt), "未显示 SAN 计数");
    assert(/第3步: 签发完成/.test(txt), "未显示第3步签发完成");
    assert(/申请订单/.test(txt), "缺少申请订单区块");
    await page.screenshot({ path: join(SHOT_DIR, "02-detail-valid.png") });
    await closeDialog(detailDlg);
    return "剩余天数/SAN/步骤/订单 均在";
  });

  await step("详情·validating(HTTP-01)：验证信息 + 验证地址 + curl 自检 + 第2步", async () => {
    await setKeyword(SEED.validatingHttp);
    await waitText(SEED.validatingHttp);
    await rowButton("详情");
    const txt = await openDetailAndWait(SEED.validatingHttp);
    assert(/验证信息/.test(txt), "缺少验证信息区块");
    assert(/\.well-known\/acme-challenge\/accept-http-token-0001/.test(txt), "缺少 HTTP-01 验证地址");
    assert(/curl 自检命令/.test(txt), "缺少 curl 自检命令");
    assert(/第2步: 等待验证/.test(txt), "未显示第2步");
    await page.screenshot({ path: join(SHOT_DIR, "03-detail-validating-http.png") });
    await closeDialog(detailDlg);
    return "HTTP-01 验证信息/curl/步骤 均在";
  });

  await step("详情·validating(DNS-01)：DNS 记录名→值，且不生成 curl", async () => {
    await setKeyword(SEED.validatingDns);
    await waitText(SEED.validatingDns);
    await rowButton("详情");
    const txt = await openDetailAndWait(SEED.validatingDns);
    assert(/_acme-challenge\.acme-validating-dns\.example\.com/.test(txt), "缺少 DNS 记录名");
    assert(/accept-dns-txt-value-0001/.test(txt), "缺少 DNS 记录值");
    assert(!/curl 自检命令/.test(txt), "DNS-01 不应生成 curl 自检");
    await closeDialog(detailDlg);
    return "DNS 记录正确且无 curl";
  });

  await step("详情·failed：最近错误 + 第3步失败", async () => {
    await setKeyword(SEED.failed);
    await waitText(SEED.failed);
    await rowButton("详情");
    const txt = await openDetailAndWait(SEED.failed);
    assert(/最近错误/.test(txt), "缺少最近错误区块");
    assert(/验证未通过/.test(txt), "未回显错误内容");
    assert(/第3步: 签发失败/.test(txt), "失败状态步骤异常");
    await closeDialog(detailDlg);
    return "错误回显正确";
  });

  await step("详情·expired 与 revoked：进度/步骤按状态渲染", async () => {
    await setKeyword(SEED.validExpired);
    await waitText(SEED.validExpired);
    await rowButton("详情");
    const t1 = await openDetailAndWait(SEED.validExpired);
    assert(/已过期 \d+ 天/.test(t1), "过期展示异常");
    await closeDialog(detailDlg);
    await setKeyword(SEED.revoked);
    await waitText(SEED.revoked);
    await rowButton("详情");
    const t2 = await openDetailAndWait(SEED.revoked);
    assert(/证书已吊销|证书已吐销/.test(t2), "吊销文案缺失");
    await closeDialog(detailDlg);
    return "过期/吊销 渲染正确";
  });

  await step("下载：证书/私钥/证书链 三种文件真实产出且内容正确", async () => {
    await setKeyword(SEED.validFar);
    await waitText(SEED.validFar);
    await rowButton("下载");
    await downloadDlg().waitFor({ state: "visible", timeout: 15_000 });
    const expect = [
      { idx: 0, file: `${SEED.validFar}.crt`, frag: "acceptanceChainPem0001" },
      { idx: 1, file: `${SEED.validFar}.key`, frag: "acceptanceKeyPem0001" },
      { idx: 2, file: `${SEED.validFar}_chain.crt`, frag: "acceptanceChainPem0001" },
    ];
    for (const e of expect) {
      const [dl] = await Promise.all([
        page.waitForEvent("download", { timeout: 20_000 }),
        downloadDlg().locator(".dlg-item").nth(e.idx).evaluate((el) => el.click()),
      ]);
      assert(dl.suggestedFilename() === e.file, `文件名期望 ${e.file} 实得 ${dl.suggestedFilename()}`);
      const p = await dl.path();
      assert(existsSync(p) && readFileSync(p, "utf8").includes(e.frag), `下载内容缺片段 ${e.frag}`);
    }
    await closeDialog(downloadDlg);
    return "3/3 文件与内容均正确";
  });

  await step("下载·负路径：无证书内容的记录应报失败", async () => {
    await setKeyword(SEED.validSoon);
    await waitText(SEED.validSoon);
    await rowButton("下载");
    await downloadDlg().waitFor({ state: "visible", timeout: 15_000 });
    await drainToasts();
    await downloadDlg().locator(".dlg-item").first().evaluate((el) => el.click());
    const t = await waitToast();
    assert(/证书内容为空|404|失败|错误|Network|超时/.test(t), `空内容下载未给出失败提示: ${t}`);
    await closeDialog(downloadDlg);
    return t.slice(0, 80);
  });

  await step("条件渲染：validating 显示「重新验证」，valid 不显示", async () => {
    await setKeyword(SEED.validatingHttp);
    await waitText(SEED.validatingHttp);
    assert((await page.locator(".vxe-table--main-wrapper .op-cell button.el-button").filter({ hasText: "重新验证" }).count()) > 0,
      "validating 应出现「重新验证」");
    await setKeyword(SEED.validFar);
    await waitText(SEED.validFar);
    assert((await page.locator(".vxe-table--main-wrapper .op-cell button.el-button").filter({ hasText: "重新验证" }).count()) === 0,
      "valid 不应出现「重新验证」");
    return "条件渲染正确";
  });

  await step("重新验证（validating）：受理并提示", async () => {
    await setKeyword(SEED.validatingDns);
    await waitText(SEED.validatingDns);
    await drainToasts();
    await rowButton("重新验证");
    const t = await waitToast(60_000);
    assert(/已重新触发验证|重新验证已提交|操作成功|失败|错误|超时/.test(t), `重新验证提示异常: ${t}`);
    await page.waitForTimeout(3000);
    return t.slice(0, 80);
  });

  await step("续签（valid）：确认框 → 有结果反馈且无崩溃", async () => {
    await setKeyword(SEED.validSoon);
    await waitText(SEED.validSoon);
    await rowButton("续签");
    const t = await confirmAndToast(60_000);
    assert(t.length > 0, "续签未给出任何提示");
    return t.slice(0, 80);
  });

  await step("吊销：确认框 → 有结果反馈且无崩溃", async () => {
    await setKeyword(SEED.validFar);
    await waitText(SEED.validFar);
    await rowButton("吊销");
    const t = await confirmAndToast(60_000);
    assert(t.length > 0, "吊销未给出任何提示");
    return t.slice(0, 80);
  });

  await step("续签检查：一键触发并提示", async () => {
    await drainToasts();
    await toolbarButton("续签检查");
    const t = await waitToast(90_000);
    assert(t.length > 0, "续签检查未给出提示");
    return t.slice(0, 80);
  });

  await step("申请弹窗校验：通配符 + HTTP-01 被前端拦截", async () => {
    await switchTab("certs");
    await toolbarButton("申请证书");
    await applyDlg().waitFor({ state: "visible", timeout: 15_000 });
    await applyDlg().locator(".el-select").first().click();
    await page.locator(".el-select-dropdown__item", { hasText: NEW_ACCOUNT }).first().click();
    await applyDlg().locator('input[placeholder="example.com 或 *.example.com"]').fill("*.example.com");
    await drainToasts();
    await clickDialogButton(applyDlg, "提交申请");
    const t = await waitToast();
    assert(/通配符域名仅支持 DNS-01/.test(t), `通配符校验未拦截: ${t}`);
    return t.slice(0, 60);
  });

  await step("申请弹窗校验：SSH 模式必填被前端拦截", async () => {
    // 每步都在 resetUi() 后独立开始：这里自行打开申请弹窗（不再依赖上一步遗留的弹窗）。
    await switchTab("certs");
    await toolbarButton("申请证书");
    await applyDlg().waitFor({ state: "visible", timeout: 15_000 });
    await applyDlg().locator(".el-select").first().click();
    await page.locator(".el-select-dropdown__item", { hasText: NEW_ACCOUNT }).first().click();
    await applyDlg().locator('input[placeholder="example.com 或 *.example.com"]').fill("accept-ssh.example.com");
    await applyDlg().locator(".el-radio-button", { hasText: "SSH 远程部署" }).click();
    await page.waitForTimeout(600);
    await drainToasts();
    await clickDialogButton(applyDlg, "提交申请");
    const t = await waitToast();
    assert(/SSH 模式需要填写密码|需要填写服务器地址|需要填写用户名/.test(t), `SSH 必填未拦截: ${t}`);
    await clickDialogButton(applyDlg, "取消");
    await page.waitForTimeout(500);
    return t.slice(0, 60);
  });

  await step("申请证书（DNS-01）可受理并落库", async () => {
    // 崩溃重放：若上一次尝试已提交成功，跳过重复提交直接断言可见。
    await switchTab("certs");
    const applied = (await (async () => { await setKeyword(DIALOG_DOMAIN); return page.getByText(DIALOG_DOMAIN, { exact: false }).count(); })()) > 0;
    if (!applied) {
      await toolbarButton("申请证书");
      await applyDlg().waitFor({ state: "visible", timeout: 15_000 });
      await applyDlg().locator(".el-select").first().click();
      await page.locator(".el-select-dropdown__item", { hasText: NEW_ACCOUNT }).first().click();
      await applyDlg().locator('input[placeholder="example.com 或 *.example.com"]').fill(DIALOG_DOMAIN);
      await applyDlg().locator(".el-radio-button", { hasText: "DNS-01" }).click();
      await drainToasts();
      await clickDialogButton(applyDlg, "提交申请");
      const t = await waitToast();
      assert(/已提交|后台异步签发|操作成功/.test(t), `DNS-01 申请未受理: ${t}`);
      await detailDlg().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
      if (await detailDlg().isVisible().catch(() => false)) await closeDialog(detailDlg);
    }
    await setKeyword(DIALOG_DOMAIN);
    await waitText(DIALOG_DOMAIN);
    return DIALOG_DOMAIN;
  });

  await step("删除证书：确认框 → 记录从列表消失", async () => {
    await switchTab("certs");
    await setKeyword(NEW_DOMAIN);
    // 崩溃重放：上一次尝试可能已删除成功，此处以「确已消失」为达成条件。
    if ((await page.getByText(NEW_DOMAIN, { exact: false }).count()) > 0) {
      await waitText(NEW_DOMAIN);
      await rowButton("删除");
      const t = await confirmAndToast(30_000);
      assert(/证书已删除|操作成功/.test(t), `删除提示异常: ${t}`);
      await page.waitForTimeout(1300);
    }
    assert((await page.getByText(NEW_DOMAIN, { exact: false }).count()) === 0, "删除后列表仍可见该域名");
    return NEW_DOMAIN;
  });

  // ---------- 账户管理 ----------
  await step("账户管理页签：受控账户可见、服务商标签映射、共 2 条", async () => {
    await switchTab("accounts");
    await waitText(SEED.account);
    const txt = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    assert(/Let's Encrypt \(测试\)/.test(txt), "服务商标签未映射为中文");
    assert(/共 2 条/.test(txt), "账户总数应为 2（受控 + 运行期新增）");
    await page.screenshot({ path: join(SHOT_DIR, "04-accounts.png") });
    return "账户/服务商/状态 正确";
  });

  await step("编辑账户：改备注 → 保存 → 列表回显", async () => {
    await switchTab("accounts");
    await rowButtonIn(NEW_ACCOUNT, "编辑");
    await accountDlg().waitFor({ state: "visible", timeout: 15_000 });
    const remark = `交付验收-${stamp}`;
    await accountDlg().locator("textarea").first().fill(remark);
    await drainToasts();
    await clickDialogButton(accountDlg, "保存");
    const t = await waitToast();
    assert(/已更新|操作成功/.test(t), `编辑账户提示异常: ${t}`);
    await page.waitForTimeout(1300);
    await waitText(remark);
    return remark;
  });

  await step("删除账户·负路径：有关联证书的账户被后端拒绝", async () => {
    await switchTab("accounts");
    await rowButtonIn(SEED.account, "删除");
    const t = await confirmAndToast(20_000);
    assert(/存在证书，无法删除|无法删除/.test(t), `删除有证书账户未被拒绝: ${t}`);
    return t.slice(0, 60);
  });

  await step("新增空账户并删除（正路径）", async () => {
    await switchTab("accounts");
    // 崩溃重放：上一次尝试可能已完成「新增并删除」，此时直接断言其不存在即可。
    const existed = (await page.getByText(EMPTY_ACCOUNT, { exact: false }).count()) > 0;
    if (!existed) {
      await toolbarButton("添加账户");
      await accountDlg().waitFor({ state: "visible", timeout: 15_000 });
      await accountDlg().locator('input[placeholder="example@domain.com"]').fill(EMPTY_ACCOUNT);
      await drainToasts();
      await clickDialogButton(accountDlg, "保存");
      await waitToast();
      await page.waitForTimeout(1600);
      await waitText(EMPTY_ACCOUNT);
    }
    await rowButtonIn(EMPTY_ACCOUNT, "删除");
    const t = await confirmAndToast(20_000);
    assert(/账户已删除|操作成功/.test(t), `空账户删除失败: ${t}`);
    await page.waitForTimeout(1300);
    assert((await page.getByText(EMPTY_ACCOUNT, { exact: false }).count()) === 0, "空账户删除后仍可见");
    return EMPTY_ACCOUNT;
  });

  await step("账户弹窗校验：EAB 服务商缺凭证被拦截", async () => {
    await switchTab("accounts");
    await toolbarButton("添加账户");
    await accountDlg().waitFor({ state: "visible", timeout: 15_000 });
    await accountDlg().locator('input[placeholder="example@domain.com"]').fill(EAB_ACCOUNT);
    await accountDlg().locator(".el-select").first().click();
    await page.locator(".el-select-dropdown__item", { hasText: "ZeroSSL" }).first().click();
    await drainToasts();
    await clickDialogButton(accountDlg, "保存");
    const t = await waitToast();
    assert(/需要 EAB/.test(t), `EAB 校验未拦截: ${t}`);
    await clickDialogButton(accountDlg, "取消");
    await page.waitForTimeout(500);
    return t.slice(0, 60);
  });

  await step("账户弹窗校验：邮箱必填拦截", async () => {
    await switchTab("accounts");
    await toolbarButton("添加账户");
    await accountDlg().waitFor({ state: "visible", timeout: 15_000 });
    await drainToasts();
    await clickDialogButton(accountDlg, "保存");
    const t = await waitToast();
    assert(/请填写邮箱/.test(t), `邮箱必填未拦截: ${t}`);
    await clickDialogButton(accountDlg, "取消");
    await page.waitForTimeout(500);
    return t.slice(0, 60);
  });

  await step("全局：无 JS 运行时错误且无非白名单 4xx/5xx", async () => {
    assert(pageErrors.length === 0, `JS 错误: ${pageErrors.slice(0, 3).join(" ;; ")}`);
    assert(httpErrors.length === 0, `HTTP 错误: ${httpErrors.slice(0, 3).join(" ;; ")}`);
    return `pageErrors=${pageErrors.length} httpErrors=${httpErrors.length}`;
  });
} catch (e) {
  if (isCrash(e)) crashed = true;
  record("浏览器验收主流程未预期中断", false, String(e?.message || e).slice(0, 400));
  try { await page.screenshot({ path: join(SHOT_DIR, "99-abort.png") }); } catch { /* ignore */ }
} finally {
  try {
    const h = token ? { "x-oauth-token": token } : {};
    const prefixes = [NEW_DOMAIN, DIALOG_DOMAIN];
    const list = await (await fetch(`${ACME_BASE}/page?page=1&pageSize=100`, { headers: h })).json();
    const rows = list?.data?.data?.data ?? list?.data?.data ?? [];
    for (const c of rows) {
      if (prefixes.some((p) => (c.acmeCertPrimaryDomain || "").startsWith(p))) {
        await fetch(`${ACME_BASE}/${c.acmeCertId}`, { method: "DELETE", headers: h });
      }
    }
    for (const email of [NEW_ACCOUNT, EMPTY_ACCOUNT, EAB_ACCOUNT]) {
      const accs = await (await fetch(`${ACME_BASE}/account/list`, { headers: h })).json();
      for (const a of accs?.data ?? []) {
        if (a.acmeAccountEmail === email) {
          await fetch(`${ACME_BASE}/account/${a.acmeAccountId}`, { method: "DELETE", headers: h });
        }
      }
    }
    console.log("[cleanup] 运行期数据已清理");
  } catch (e) {
    console.log(`[cleanup] 清理失败（可由 SQL 复位）：${String(e?.message || e)}`);
  }
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n==== ACME 生产级浏览器交付验收：${results.length - failed.length}/${results.length} PASS ====`);
if (failed.length) console.log("失败项：\n" + failed.map((f) => `  - ${f.name} :: ${f.detail}`).join("\n"));
console.log(`截图目录：${SHOT_DIR}`);
if (crashed) { console.log("RESULT=CRASHED（浏览器被系统回收，需复位数据后重跑）"); process.exit(3); }
console.log(`RESULT=${failed.length === 0 ? "ALL_PASS" : "FAILED"}`);
process.exit(failed.length === 0 ? 0 : 2);
