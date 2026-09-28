/**
 * Nginx 控制台 —— 全业务功能验收（Playwright）
 *
 * 为什么用生产构建而不是 dev server：
 *   同仓库有别的 agent 在持续改文件，vite HMR 不断 page reload，
 *   浏览器端根本稳不住（实测页面反复被冲掉、组件挂不上）。
 *   dist 是静态产物，无 HMR，验收期间不会被任何人打断。
 *
 * 覆盖：
 *   1) 登录 → 工作台
 *   2) 数据源中心：列表 / 新增页签 / 数据表（并入的数据库管理器）
 *   3) Nginx 控制台 6 个页签逐个打开并断言有真实内容
 *   4) 生命周期：校验配置 → 重载 → 停止（断言 8080 真的挂）→ 启动（断言恢复）
 *      停止/启动期间会短暂中断 8080，脚本结束前必定恢复；异常退出会留 nginx 停着，
 *      兜底：systemctl start ngx-console（不依赖本控制台）
 *
 * 用法：node nginx-console-acceptance.mjs [基址=http://127.0.0.1:8850]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:8850";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-acceptance");
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, detail = "") {
  pass++;
  console.log(`  [PASS] ${name}${detail ? "  " + detail : ""}`);
}
function bad(name, detail = "") {
  fail++;
  failures.push(name + (detail ? " :: " + detail : ""));
  console.log(`  [FAIL] ${name}${detail ? "  " + detail : ""}`);
}
function check(name, cond, detail = "") {
  cond ? ok(name, detail) : bad(name, detail);
  return !!cond;
}

/** 等某个选择器出现并返回其文本；超时返回 null */
async function textOf(page, sel, timeout = 15000) {
  try {
    await page.waitForSelector(sel, { timeout });
    return ((await page.locator(sel).first().innerText()) || "").trim();
  } catch {
    return null;
  }
}

/** 探测 8080 是否在服务（用 node 自己发请求，不引额外依赖） */
async function probe8080() {
  try {
    const r = await fetch("http://192.168.50.198:8080/", { signal: AbortSignal.timeout(8000) });
    return r.status;
  } catch {
    return 0;
  }
}

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
});
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));

try {
  // ============ 1) 登录 ============
  console.log("\n===== 1) 登录 =====");
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[placeholder*='用户名']", { timeout: 30000 });
  await page.fill("input[placeholder*='用户名']", "admin");
  await page.fill("input[type='password']", "admin@123!456");
  await page.click("button:has-text('登录')");
  await page.waitForTimeout(4000);
  const loggedIn = !(await page.locator("text=欢迎登录").count());
  check("登录成功并离开登录页", loggedIn, `url=${page.url()}`);

  // ============ 2) 数据源中心 ============
  console.log("\n===== 2) 数据源中心 =====");
  await page.goto(`${BASE}/#/datasource`, { waitUntil: "domcontentloaded" });
  const dsList = await textOf(page, ".ds-side__list", 25000);
  check("数据源列表渲染", !!dsList && dsList.length > 0, (dsList || "").slice(0, 60));

  const tabs = await textOf(page, ".re-tab-capsule__nav", 15000);
  check("页签含并入的「数据表」", !!tabs && tabs.includes("数据表"), (tabs || "").replace(/\s+/g, " "));

  // 选 mysql（JDBC）后进数据表
  const mysqlItem = page.locator(".ds-item", { hasText: "JDBC" }).first();
  if (await mysqlItem.count()) {
    await mysqlItem.click();
    await page.waitForTimeout(2500);
    await page.locator(".re-tab-capsule__item", { hasText: "数据表" }).first().click();
    const tree = await textOf(page, ".dbm-tree", 25000);
    check("数据表加载出库列表", !!tree && tree.includes("ngxacc"), (tree || "").replace(/\s+/g, " ").slice(0, 70));
    check("内嵌模式隐藏了数据源下拉（改用只读标识）", (await page.locator(".dbm-ds-chip").count()) > 0);
    check("内嵌模式未渲染独立下拉", (await page.locator(".dbm-toolbar-right .el-select").count()) === 0);
    await page.screenshot({ path: path.join(SHOT_DIR, "01-datasource-browse.png") });
  } else {
    bad("找到 JDBC 数据源卡片");
  }

  // 非 JDBC 应给明确提示而非默默回退
  const nginxItem = page.locator(".ds-item", { hasText: "NGINX" }).first();
  if (await nginxItem.count()) {
    await nginxItem.click();
    await page.waitForTimeout(2000);
    await page.locator(".re-tab-capsule__item", { hasText: "数据表" }).first().click();
    const tip = await textOf(page, ".dsc-browse-empty", 12000);
    check("非 JDBC 数据源给出明确说明", !!tip && tip.includes("没有库/表"), (tip || "").slice(0, 60));
  }

  // ============ 3) Nginx 控制台 6 个页签 ============
  console.log("\n===== 3) Nginx 控制台各页签 =====");
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
  const crumb = await textOf(page, ".ngm-crumb", 30000);
  check("总览加载到运行态", !!crumb && crumb.includes("运行中"), (crumb || "").replace(/\s+/g, " ").slice(0, 80));
  await page.screenshot({ path: path.join(SHOT_DIR, "02-nginx-overview.png") });

  const topCard = await textOf(page, ".ngx-top-card", 10000);
  check("访问 Top 卡片渲染", !!topCard && topCard.includes("访问 Top"), (topCard || "").slice(0, 50));
  const trend = await textOf(page, ".ngx-trend-body", 10000);
  check("趋势图渲染出曲线容器（非空态）", !!trend && trend.includes("0.75"), (trend || "").replace(/\s+/g, " ").slice(0, 50));

  const TABS = [
    { i: 2, name: "站点", must: "个站点" },
    { i: 3, name: "配置", must: "conf" },
    { i: 4, name: "日志", must: "自动刷新" },
    { i: 5, name: "备份", must: "备份" },
    { i: 6, name: "模板库", must: "模板" },
  ];
  for (const t of TABS) {
    await page.locator(`.ngm-nav-item:nth-of-type(${t.i})`).click();
    await page.waitForTimeout(2500);
    const body = await textOf(page, ".ngm-main", 20000);
    check(`页签「${t.name}」有真实内容`, !!body && body.includes(t.must), (body || "").replace(/\s+/g, " ").slice(0, 70));
    await page.screenshot({ path: path.join(SHOT_DIR, `03-tab-${t.name}.png`) });
  }
  await page.locator(".ngm-nav-item:nth-of-type(1)").click();
  await page.waitForTimeout(2000);

  // ============ 4) 生命周期：校验 → 重载 → 停止 → 启动 ============
  console.log("\n===== 4) 生命周期 =====");
  const before8080 = await probe8080();
  check("操作前 8080 在服务", before8080 > 0, `HTTP ${before8080}`);

  const btnLabels = async () => ((await page.locator(".ngm-actions").innerText()) || "").replace(/\s+/g, " ");
  const runningBtns = await btnLabels();
  check(
    "RUNNING 态按钮为 校验/重载/重启/停止",
    ["校验配置", "重载", "重启", "停止"].every((b) => runningBtns.includes(b)),
    runningBtns.slice(0, 80),
  );

  // 4.1 校验配置（只读）
  await page.locator("button", { hasText: "校验配置" }).first().click();
  await page.waitForTimeout(6000);
  const dlg = await textOf(page, ".el-dialog", 15000);
  check("校验配置返回通过", !!dlg && dlg.includes("语法检查通过"), (dlg || "").replace(/\s+/g, " ").slice(0, 90));
  await page.screenshot({ path: path.join(SHOT_DIR, "04-validate.png") });
  const closeBtn = page.locator(".el-dialog__headerbtn").first();
  if (await closeBtn.count()) await closeBtn.click();
  await page.waitForTimeout(1500);

  // 4.2 重载
  await page.locator("button", { hasText: "重载" }).first().click();
  await page.waitForTimeout(8000);
  const afterReload = await probe8080();
  check("重载后 8080 仍在服务", afterReload > 0, `HTTP ${afterReload}`);
  const reloadDlg = await textOf(page, ".el-dialog", 8000);
  console.log(`         重载返回：${(reloadDlg || "(无弹窗)").replace(/\s+/g, " ").slice(0, 100)}`);
  const cb2 = page.locator(".el-dialog__headerbtn").first();
  if (await cb2.count()) await cb2.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SHOT_DIR, "05-reload.png") });

  // 4.3 停止（真停；要能恢复）
  console.log("  -- 执行停止（8080 会短暂不可用）--");
  await page.locator("button", { hasText: "停止" }).first().click();
  // 可能弹二次确认
  const confirmBtn = page.locator(".el-message-box__btns button, .el-dialog button").filter({ hasText: /确定|确认|停止/ });
  if (await confirmBtn.count()) {
    await confirmBtn.first().click();
  }
  await page.waitForTimeout(10000);
  const afterStop = await probe8080();
  check("停止后 8080 已不可用（真的停了）", afterStop === 0, `HTTP ${afterStop}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "06-stopped.png") });

  // 停止后按钮应变「校验/启动」
  await page.waitForTimeout(3000);
  const stoppedBtns = await btnLabels().catch(() => "");
  check(
    "STOPPED 态按钮为 校验/启动（无重启/停止）",
    !!stoppedBtns && stoppedBtns.includes("启动") && !stoppedBtns.includes("重载"),
    stoppedBtns.slice(0, 80),
  );

  // 4.4 启动（必须恢复）
  console.log("  -- 执行启动（恢复服务）--");
  const startBtn = page.locator("button", { hasText: "启动" }).first();
  if (await startBtn.count()) {
    await startBtn.click();
    const cb3 = page.locator(".el-message-box__btns button, .el-dialog button").filter({ hasText: /确定|确认/ });
    if (await cb3.count()) await cb3.first().click();
  } else {
    bad("找到「启动」按钮");
  }
  await page.waitForTimeout(12000);
  const afterStart = await probe8080();
  check("启动后 8080 恢复服务", afterStart > 0, `HTTP ${afterStart}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "07-started.png") });

  // 回到运行态
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
  const crumb2 = await textOf(page, ".ngm-crumb", 30000);
  check("控制台回到运行态", !!crumb2 && crumb2.includes("运行中"), (crumb2 || "").replace(/\s+/g, " ").slice(0, 80));

  // ============ 5) 控制台报错 ============
  console.log("\n===== 5) 控制台错误 =====");
  // 过滤掉与业务无关的既有噪音
  const noise = /ElOnlyChild|already been registered|non-element root node|custom validator|Invalid prop|was made a reactive object/;
  const real = consoleErrors.filter((e) => !noise.test(e));
  check("无业务相关 console error", real.length === 0, real.slice(0, 3).join(" | "));
  if (real.length) console.log("         " + real.slice(0, 5).join("\n         "));
} catch (e) {
  bad("脚本执行异常", String(e).slice(0, 300));
} finally {
  const final8080 = await probe8080();
  console.log(`\n收尾：8080 = HTTP ${final8080}${final8080 > 0 ? "（服务已恢复）" : "（!! 服务未恢复，需 systemctl start ngx-console）"}`);
  console.log(`截图目录：${SHOT_DIR}`);
  console.log(`\n===== 汇总：通过 ${pass} / 失败 ${fail} =====`);
  if (failures.length) console.log("失败项：\n  - " + failures.join("\n  - "));
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}
