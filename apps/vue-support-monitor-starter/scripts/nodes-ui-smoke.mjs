/**
 * 「节点管理 → 在线节点」页面浏览器冒烟。
 *
 * <p>后端 console 尚未部署本次新增的 /ms/monitor/node 接口，因此本脚本用
 * Playwright 路由拦截提供**受控节点数据**，只验证前端交付面：
 * 菜单入口、路由、统计卡、状态筛选、关键字筛选、表格列与状态标签。</p>
 *
 * <p>后端接口本身由 Maven 编译 + 代码审查验证；部署后可直接去掉 mock 复跑。</p>
 *
 * 用法：
 *   $env:MS_APP="http://127.0.0.1:8848"
 *   $env:MS_E2E_API_LOGIN="http://192.168.50.198:8081"
 *   node scripts/nodes-ui-smoke.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLogin, E2E_CREDS } from "./ui-login.mjs";

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOT_DIR = join(APP_DIR, ".local-run", "nodes-browser");
mkdirSync(SHOT_DIR, { recursive: true });

const APP = process.env.MS_APP || "http://127.0.0.1:8848";
const API_LOGIN = process.env.MS_E2E_API_LOGIN || "http://192.168.50.198:8081";

const now = Date.now();
const NODES = [
  { clientId: "n1", applicationName: "order-service", hostname: "node-a", ipAddress: "10.0.0.11", port: 8080, serviceUrl: "http://10.0.0.11:8080", activeProfiles: "prod", osName: "Linux", javaVersion: "21", online: true, lastHeartbeat: now - 5_000, registerTime: now - 3_600_000, metadata: {} },
  { clientId: "n2", applicationName: "user-service", hostname: "node-b", ipAddress: "10.0.0.12", port: 8080, serviceUrl: "http://10.0.0.12:8080", activeProfiles: "prod", osName: "Linux", javaVersion: "21", online: true, lastHeartbeat: now - 8_000, registerTime: now - 7_200_000, metadata: {} },
  { clientId: "n3", applicationName: "report-service", hostname: "node-c", ipAddress: "10.0.0.13", port: 9000, serviceUrl: "http://10.0.0.13:9000", activeProfiles: "test", osName: "Linux", javaVersion: "17", online: false, lastHeartbeat: now - 600_000, registerTime: now - 9_000_000, metadata: {} },
];

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.route("**/*", (route) => {
  const t = route.request().resourceType();
  if (t === "image" || t === "font" || t === "media") return route.abort();
  return route.continue();
});

// 受控节点数据：拦截 /ms/monitor/node/*
await context.route("**/ms/monitor/node/**", async (route) => {
  const url = route.request().url();
  let data;
  if (url.includes("/stats")) {
    data = { total: NODES.length, online: NODES.filter(n => n.online).length, offline: NODES.filter(n => !n.online).length };
  } else if (url.includes("/online")) {
    data = NODES.filter(n => n.online);
  } else {
    data = NODES;
  }
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: "00000", data, success: true, ok: true, msg: "ok" }) });
});

const page = await context.newPage();
const pageErrors = [];
const httpErrors = [];
const NOISE = [/\/v2\/setting\/default/, /\/v2\/setting\/sso\/providers/, /\/v2\/location\/resolve/];
page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 160)));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(String(m.text()))) pageErrors.push(`console: ${m.text()}`.slice(0, 160)); });
page.on("response", (r) => { if (r.status() >= 400 && !NOISE.some((re) => re.test(r.url()))) httpErrors.push(`${r.status()} ${r.url()}`); });

const statNum = (label) => page.locator(".stat-card", { hasText: label }).locator(".stat-num").first();
const rows = () => page.locator(".el-table__body tbody tr");

async function step(name, fn) {
  try { record(name, true, (await fn()) || ""); }
  catch (e) { record(name, false, String(e?.message || e).slice(0, 240)); try { await page.screenshot({ path: join(SHOT_DIR, `fail-${results.length}.png`) }); } catch { /* ignore */ } }
}

try {
  const got = await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  record("登录进入控制台", got.ok, String(got.msg).slice(0, 50));

  await page.goto(`${APP}/#/nodes`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("h1.page-title", { hasText: "在线节点" }).waitFor({ state: "visible", timeout: 60_000 });

  await step("菜单入口「节点管理」存在", async () => {
    assert((await page.getByText("节点管理", { exact: false }).count()) > 0, "侧边栏缺少「节点管理」");
    assert((await page.getByText("在线节点", { exact: false }).count()) > 0, "侧边栏缺少「在线节点」");
    await page.screenshot({ path: join(SHOT_DIR, "01-nodes.png") });
    return "节点管理 → 在线节点";
  });

  await step("统计卡：在线 / 离线 / 总数", async () => {
    await page.waitForTimeout(800);
    const online = Number(await statNum("在线节点").innerText());
    const offline = Number(await statNum("离线节点").innerText());
    const total = Number(await statNum("注册总数").innerText());
    assert(online === 2, `在线期望 2 实得 ${online}`);
    assert(offline === 1, `离线期望 1 实得 ${offline}`);
    assert(total === 3, `总数期望 3 实得 ${total}`);
    return "2 / 1 / 3";
  });

  await step("默认「在线」筛选：只显示 2 个在线节点", async () => {
    const n = await rows().count();
    assert(n === 2, `在线筛选期望 2 行实得 ${n}`);
    const txt = (await page.locator(".el-table__body").innerText()).replace(/\s+/g, " ");
    assert(/order-service/.test(txt) && /user-service/.test(txt), "在线节点行缺失");
    assert(!/report-service/.test(txt), "离线节点不应出现在在线筛选");
    return "2 行（order/user）";
  });

  await step("切换「全部」：3 个节点，离线标签正确", async () => {
    await page.locator(".filter-bar .el-select").first().click();
    await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "全部" }).first().click();
    await page.waitForTimeout(500);
    const n = await rows().count();
    assert(n === 3, `全部期望 3 行实得 ${n}`);
    const txt = (await page.locator(".el-table__body").innerText()).replace(/\s+/g, " ");
    assert(/report-service/.test(txt), "全部视图缺少离线节点");
    assert(/离线/.test(txt), "离线标签缺失");
    return "3 行（含离线）";
  });

  await step("关键字筛选：user → 1 行", async () => {
    const input = page.locator('.filter-bar input[placeholder="应用名 / 主机 / IP / 服务地址"]').first();
    await input.fill("user");
    await page.waitForTimeout(400);
    const n = await rows().count();
    assert(n === 1, `关键字筛选期望 1 行实得 ${n}`);
    const txt = (await page.locator(".el-table__body").innerText()).replace(/\s+/g, " ");
    assert(/user-service/.test(txt), "关键字筛选结果不正确");
    return "1 行（user-service）";
  });

  await step("无 JS 运行时错误且无非白名单 4xx/5xx", async () => {
    assert(pageErrors.length === 0, `pageErrors: ${pageErrors.join(" ;; ").slice(0, 200)}`);
    assert(httpErrors.length === 0, `HTTP 错误: ${httpErrors.join(" ;; ").slice(0, 200)}`);
    return "pageErrors=0 httpErrors=0";
  });
} finally {
  await browser.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\n==== 在线节点页面冒烟：${results.length - failed.length}/${results.length} PASS ====`);
console.log(`截图目录：${SHOT_DIR}`);
process.exit(failed.length ? 2 : 0);
