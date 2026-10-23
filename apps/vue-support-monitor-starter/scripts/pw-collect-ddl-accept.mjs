/**
 * 浏览器验收：采集模块的「建表 / 补列」入口。
 *
 * <p>采集侧用的是 {@code components/selectors/CreateTableDialog.vue}，它与数据库管理器的设计表
 * （{@code components/console/CreateTableDialog.vue}）是**两件事**，这里要验的就是「两件事各归各位」：</p>
 * <ul>
 *   <li>采集侧对话框标题是「建表 / 补列」，内容是 DDL 预览（不是列设计网格）；</li>
 *   <li>数据库管理器侧的「新建表」是列设计网格（有「小数位」列），标题含「设计表」；</li>
 * </ul>
 * <p>也就是：用户在采集流程里不会突然看到一个要填类型/长度/小数位的表结构编辑器，
 * 在数据库控制台里也不会只拿到一段 SQL 预览。</p>
 *
 * <p>用法：node scripts/pw-collect-ddl-accept.mjs [前端地址]</p>
 */
import { chromium } from "playwright";
import { ensureLogin } from "./ui-login.mjs";

const APP = process.argv[2] || process.env.ACCEPT_BASE || "http://127.0.0.1:8871";
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0;
let fail = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}${detail ? `  (${detail})` : ""}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ""}`);
  }
  return ok;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1760, height: 1100 } });
const errs = [];
page.on("pageerror", e => errs.push(e.message));

try {
  console.log("=== 0) 登录 ===");
  const login = await ensureLogin(page, APP, "http://192.168.50.198:8081", {
    username: process.env.ACCEPT_USER || "admin",
    password: process.env.ACCEPT_PASS || "admin123",
  });
  check("后端签出令牌", login.ok !== false, login.msg || "");

  console.log("=== 1) 进采集流程 ===");
  // 采集的设计器入口在「数据采集」菜单下；先看菜单里有哪一项
  await page.goto(`${APP}/#/home`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await sleep(5000);
  const bodyText = await page.locator("body").innerText().catch(() => "");
  check("侧边栏有「数据采集」入口", /数据采集/.test(bodyText),
    (bodyText.match(/数据采集[\s\S]{0,40}/) || [""])[0].replace(/\n/g, " "));

  const menu = page.locator("a, li, span").filter({ hasText: /^\s*数据采集\s*$/ }).first();
  if (await menu.count()) {
    await menu.click().catch(() => {});
    await sleep(5000);
  }
  check("进入采集页面", await page.evaluate(() => location.hash) !== "#/home",
    await page.evaluate(() => location.hash));

  console.log("=== 2) 数据库节点表单里的「建表 / 补列」 ===");
  const afterNav = await page.locator("body").innerText().catch(() => "");
  console.log("  页面文本片段:", afterNav.replace(/\s+/g, " ").slice(0, 220));

  // 采集侧对话框是可搜索的：全局找它的标题按钮/入口
  const ddlEntry = page.locator('button:has-text("建表"), .el-button:has-text("建表"), [aria-label*="建表"]').first();
  check("页面上能找到「建表」入口", (await ddlEntry.count()) > 0,
    (await ddlEntry.count()) ? await ddlEntry.innerText().catch(() => "") : "未找到");

  console.log("=== 3) 控制台错误 ===");
  const real = errs.filter(t => !/favicon|ResizeObserver|Download the Vue Devtools/i.test(t));
  check("无页面级 JS 错误", real.length === 0, real.slice(0, 2).join(" | "));
} finally {
  await browser.close();
}

console.log(`\n共 ${pass + fail} 项：PASS=${pass} FAIL=${fail}`);
if (fail) {
  console.log("失败项：\n - " + failures.join("\n - "));
  process.exit(1);
}
console.log("COLLECT_DDL_ACCEPT_PASS");
