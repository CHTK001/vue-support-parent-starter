/**
 * 「节点管理 → 在线节点」真实后端验收（浏览器驱动，无接口 mock）。
 *
 * <p>前置：
 * <ol>
 *   <li>真实后端 NodeFeatureTestApplication 已启动（/ms/monitor/node 可用）；</li>
 *   <li>report 客户端模拟器已连接 sync 服务端并注册（含一个已断开的离线节点）；</li>
 *   <li>前端 dist-node 由静态服务托管，/ms 代理到该后端。</li>
 * </ol>
 *
 * 用法：
 *   $env:MS_APP="http://127.0.0.1:8848"
 *   $env:MS_E2E_API_LOGIN="http://192.168.50.198:8081"
 *   node scripts/nodes-backend-acceptance.mjs
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
  catch (e) { record(name, false, String(e?.message || e).slice(0, 260)); try { await page.screenshot({ path: join(SHOT_DIR, `backend-fail-${results.length}.png`) }); } catch { /* ignore */ } }
}

async function waitForNodes(timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const n = await rows().count().catch(() => 0);
    if (n > 0) return n;
    await page.waitForTimeout(400);
  }
  return 0;
}

try {
  const got = await ensureLogin(page, APP, API_LOGIN, E2E_CREDS);
  record("登录进入控制台", got.ok, String(got.msg).slice(0, 50));

  await page.goto(`${APP}/#/nodes`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("h1.page-title", { hasText: "在线节点" }).waitFor({ state: "visible", timeout: 60_000 });

  await step("菜单入口「节点管理 → 在线节点」", async () => {
    assert((await page.getByText("节点管理", { exact: false }).count()) > 0, "侧边栏缺少「节点管理」");
    assert((await page.getByText("在线节点", { exact: false }).count()) > 0, "侧边栏缺少「在线节点」");
    return "菜单存在";
  });

  await step("真实后端返回已注册 report 节点（含离线）", async () => {
    const n = await waitForNodes(30_000);
    assert(n > 0, "30s 内未加载到任何节点（后端或注册模拟器未就绪）");
    await page.waitForTimeout(600);
    const online = Number(await statNum("在线节点").innerText());
    const offline = Number(await statNum("离线节点").innerText());
    const total = Number(await statNum("注册总数").innerText());
    assert(total >= 3, `注册总数期望 ≥3 实得 ${total}`);
    assert(online >= 2, `在线节点期望 ≥2 实得 ${online}`);
    assert(offline >= 1, `离线节点期望 ≥1 实得 ${offline}`);
    await page.screenshot({ path: join(SHOT_DIR, "10-backend-nodes.png") });
    return `online=${online} offline=${offline} total=${total}`;
  });

  await step("默认「在线」筛选：在线节点可见、离线不出现", async () => {
    const txt = (await page.locator(".el-table__body").innerText()).replace(/\s+/g, " ");
    assert(/order-service/.test(txt), "缺少 order-service");
    assert(/user-service/.test(txt), "缺少 user-service");
    assert(!/report-service/.test(txt), "离线节点不应出现在「在线」筛选");
    return "order/user 可见";
  });

  await step("切换「全部」：离线节点带「离线」标签", async () => {
    await page.locator(".filter-bar .el-select").first().click();
    await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "全部" }).first().click();
    await page.waitForTimeout(600);
    const txt = (await page.locator(".el-table__body").innerText()).replace(/\s+/g, " ");
    assert(/report-service/.test(txt), "全部视图缺少 report-service（离线）");
    assert(/离线/.test(txt), "缺少离线标签");
    return "3 行（2 在线 + 1 离线）";
  });

  await step("关键字筛选：user → 命中 user-service", async () => {
    const input = page.locator('.filter-bar input[placeholder="应用名 / 主机 / IP / 服务地址"]').first();
    await input.fill("user");
    await page.waitForTimeout(500);
    const txt = (await page.locator(".el-table__body").innerText()).replace(/\s+/g, " ");
    assert(/user-service/.test(txt), "关键字筛选未命中 user-service");
    assert(!/order-service/.test(txt), "关键字筛选未收敛");
    return "1 行";
  });

  await step("内部发现接口 /ms/monitor/node/discovery/*（真实后端）", async () => {
    const status = await page.evaluate(async () => {
      const r = await fetch("/ms/monitor/node/discovery/status");
      return r.json();
    });
    const s = status?.data ?? status;
    assert(s?.enabled === true, `status.enabled 期望 true 实得 ${JSON.stringify(status)}`);
    assert(Array.isArray(s?.availableProtocols) && s.availableProtocols.includes("report"), "availableProtocols 缺少 report");

    const services = await page.evaluate(async () => {
      const r = await fetch("/ms/monitor/node/discovery/services?protocol=report");
      return r.json();
    });
    const d = services?.data ?? services;
    assert(Array.isArray(d?.instances) && d.instances.length >= 2, `services.instances 期望 ≥2 实得 ${JSON.stringify(services)}`);
    const names = d.instances.map(i => i.uriSpec);
    assert(names.includes("order-service") && names.includes("user-service"), `实例缺少 order/user: ${names}`);
    assert(!names.includes("report-service"), "已离线节点不应出现在发现实例中");
    return `instances=${d.instances.length}`;
  });

  await step("无 JS 运行时错误且无非白名单 4xx/5xx", async () => {
    assert(pageErrors.length === 0, `pageErrors: ${pageErrors.join(" ;; ").slice(0, 220)}`);
    assert(httpErrors.length === 0, `HTTP 错误: ${httpErrors.join(" ;; ").slice(0, 220)}`);
    return "pageErrors=0 httpErrors=0";
  });
} finally {
  await browser.close();
}

const failed = results.filter(r => !r.ok);
console.log(`\n==== 在线节点真实后端验收：${results.length - failed.length}/${results.length} PASS ====`);
console.log(`截图目录：${SHOT_DIR}`);
process.exit(failed.length ? 2 : 0);
