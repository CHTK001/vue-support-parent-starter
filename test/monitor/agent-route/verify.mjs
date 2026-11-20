/**
 * ScAgentList 路由补注册后的浏览器验收（批次 A 收尾缺陷修复复验）。
 *
 * <p>背景：{@code pages/monitor/src/views/agents/ScAgentList.vue} 此前无路由注册
 * （/#/agents 落 404），已在 {@code pages/monitor/src/routes.ts} 的「服务管理」分组
 * 下补挂 /agents。本脚本以真实链路复验：8848（vite dev，复用在跑实例）→ 194:8082 后端
 * （AgentEndpointController /ms/monitor/agent/*）。全程只读（GET list / config），不写数据。</p>
 *
 * <p>运行：node test/monitor/agent-route/verify.mjs</p>
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.ACCEPT_BASE ?? "http://127.0.0.1:8848";
const OUT = path.resolve("D:/ch/project/temp/monitor-agent-route");
fs.mkdirSync(OUT, { recursive: true });

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const results = [];
const assert = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
};

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  await page
    .waitForFunction(
      () => document.querySelector("input[name='username']") && document.querySelector("input[name='password']"),
      null,
      { timeout: 45000 },
    )
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const b = document.querySelector(".loading-box");
        return !b || getComputedStyle(b).display === "none";
      },
      null,
      { timeout: 40000 },
    )
    .catch(() => {});

  for (let s = 1; s <= 3; s++) {
    const track = page.locator(".slider-verify-track").first();
    if (!(await track.count())) break;
    const tb = await track.boundingBox().catch(() => null);
    if (!tb) break;
    const sy = tb.y + tb.height / 2;
    const sx = tb.x + 22;
    const ex = tb.x + tb.width + 30;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(sx + ((ex - sx) * i) / 12, sy, { steps: 1 });
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
    const passed = await page.evaluate(
      () => !!document.querySelector(".slider-verify--success, .slider-verify.is-success"),
    );
    log(`slider try${s} passed=${passed}`);
    if (passed) break;
  }

  await page.fill("input[name='username']", "admin");
  await page.fill("input[name='password']", "admin123");
  const respP = page
    .waitForResponse((r) => /user\/login/.test(r.url()) && r.request().method() === "POST", { timeout: 40000 })
    .catch(() => null);
  await page.locator(".login-btn").click({ timeout: 15000 }).catch(() => {});
  const resp = await respP;
  log(`login status=${resp ? resp.status() : "none"}`);
  await page.waitForFunction(() => !location.hash.includes("/login"), null, { timeout: 45000 }).catch(() => {});
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

  await login(page);
  assert("登录成功", !/\/login/.test(page.url()), page.url());

  // ---- 侧边栏菜单出现「Agent 探针」（showLink:true 静态路由进菜单）----
  await page.waitForTimeout(2500);
  const menuTxt = await page.evaluate(() => document.body.innerText);
  assert("侧边栏出现「Agent 探针」菜单项", menuTxt.includes("Agent 探针"));

  // ---- 直达 /#/agents：路由可达、不再 404 ----
  const listRespP = page
    .waitForResponse((r) => /\/ms\/monitor\/agent\/list/.test(r.url()), { timeout: 60000 })
    .catch(() => null);
  await page.goto(`${BASE}/#/agents`, { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  const listResp = await listRespP;
  assert("GET /ms/monitor/agent/list 已发出", !!listResp, listResp ? listResp.url() : "no request");

  // 首次动态导入可能吃到 vite 504 Outdated Optimize Dep：空白则 reload 重试一次
  await page
    .waitForFunction(() => document.body.innerText.includes("Agent 总数"), null, { timeout: 45000 })
    .catch(() => {});
  let bodyTxt = await page.evaluate(() => document.body.innerText);
  if (!bodyTxt.includes("Agent 总数")) {
    log("页面空白，疑似 vite 依赖优化过期，reload 重试");
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
    await page
      .waitForFunction(() => document.body.innerText.includes("Agent 总数"), null, { timeout: 45000 })
      .catch(() => {});
    bodyTxt = await page.evaluate(() => document.body.innerText);
  }

  assert("/#/agents 渲染 Agent 列表页（含「Agent 总数」统计卡）", bodyTxt.includes("Agent 总数"),
    bodyTxt.slice(0, 120).replace(/\n/g, "|"));
  assert("不再落 404 页", !bodyTxt.includes("您想看的页面不存在"), bodyTxt.slice(0, 120).replace(/\n/g, "|"));
  assert("hash 停在 /#/agents", page.url().includes("#/agents"), page.url());
  assert("无加载失败错误态", !bodyTxt.includes("Agent 列表加载失败"));
  assert("在线/离线统计卡齐备", bodyTxt.includes("在线") && bodyTxt.includes("离线"));
  await page.screenshot({ path: path.join(OUT, "agent-list-page.png") });

  // ---- 列表接口返回与表格渲染 ----
  const listOk = listResp ? listResp.status() : 0;
  assert("agent/list 响应 200", listOk === 200, `status=${listOk}`);

  // ---- 有数据则真点「配置」按钮（只读），验证 config 接口与弹窗 ----
  // tableId 只作 localStorage 键、不落 DOM，行数直接按 .agent-list 根下 tbody 行数统计
  const rowCount = await page.evaluate(() => {
    const root = document.querySelector(".agent-list");
    return root ? root.querySelectorAll("tbody tr").length : -1;
  });
  log(`agent table rows=${rowCount}`);
  if (rowCount > 0) {
    const cfgRespP = page
      .waitForResponse((r) => /\/ms\/monitor\/agent\/config\//.test(r.url()), { timeout: 30000 })
      .catch(() => null);
    await page.locator(".agent-list tbody tr").first().locator("button", { hasText: "配置" }).first()
      .click({ timeout: 15000 }).catch(() => {});
    const cfgResp = await cfgRespP;
    assert("GET /ms/monitor/agent/config/{id} 已发出且 200",
      !!cfgResp && cfgResp.status() === 200, cfgResp ? `status=${cfgResp.status()}` : "no request");
    await page.waitForTimeout(1500);
    const dlgTxt = await page.evaluate(() => document.body.innerText);
    assert("Agent 配置弹窗打开（采集间隔/采集任务）",
      dlgTxt.includes("Agent 配置") && dlgTxt.includes("采集间隔") && dlgTxt.includes("采集任务"));
    await page.screenshot({ path: path.join(OUT, "agent-config-dialog.png") });
  } else {
    assert("当前无已登记探针目标：空态正常展示（后端 194 无 agent 数据时允许）",
      bodyTxt.includes("暂无数据") || bodyTxt.includes("No Data") || rowCount === 0, `rows=${rowCount}`);
  }
} finally {
  await browser.close().catch(() => {});
}

const fails = results.filter((r) => !r.ok);
console.log("==== RESULT ====");
console.log(`total=${results.length} pass=${results.length - fails.length} fail=${fails.length}`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.name} | ${r.detail}`);
if (fails.length) process.exitCode = 1;
