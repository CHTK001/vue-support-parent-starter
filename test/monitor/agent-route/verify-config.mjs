/**
 * ScAgentList「配置」弹窗真点验收（agent-route 复验的补强）。
 *
 * <p>verify.mjs 复验时 194 的 ms_monitor 无已登记探针标识的行（rows=0），配置弹窗未真点。
 * 本脚本经后端 MonitorController（/ms/monitor）创建一条带探针标识的临时监控资产
 * （monitorEnabled=0，不进采集调度；名称带「验收临时-」前缀便于识别），
 * 真点该行「配置」按钮，断言 GET /ms/monitor/agent/config/{id} 200 与弹窗内容，
 * 最后按精确 id 删除还原、复核列表无残留。真实链路：8848 → 194:8082。</p>
 *
 * <p>运行：node test/monitor/agent-route/verify-config.mjs</p>
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.ACCEPT_BASE ?? "http://127.0.0.1:8848";
const OUT = path.resolve("D:/ch/project/temp/monitor-agent-route");
fs.mkdirSync(OUT, { recursive: true });
const NAME = "验收临时-探针目标";
const AGENT_KEY = "acceptance-agent-key-001";

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

/** 带登录态的监控资产 API（创建 / 删除 / 列表关键字查询） */
function monitorApi(page) {
  return {
    create: async (body) =>
      page.evaluate(async (b) => {
        const t = localStorage.getItem("token") || "";
        const res = await fetch("/ms/monitor", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, t ? { Authorization: `Bearer ${t}` } : {}),
          body: JSON.stringify(b),
        });
        const j = await res.json().catch(() => ({}));
        return { code: j.code, id: j.data && j.data.id, agentKey: j.data && j.data.monitorAgentKey, msg: j.msg };
      }, body),
    remove: async (id) =>
      page.evaluate(async (i) => {
        const t = localStorage.getItem("token") || "";
        const res = await fetch(`/ms/monitor/${i}`, {
          method: "DELETE",
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        });
        const j = await res.json().catch(() => ({}));
        return { code: j.code, msg: j.msg };
      }, id),
    listByName: async (name) =>
      page.evaluate(async (n) => {
        const t = localStorage.getItem("token") || "";
        const res = await fetch("/ms/monitor", {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        });
        const j = await res.json().catch(() => ({}));
        const all = j.data || [];
        return all
          .filter((r) => r.monitorName === n)
          .map((r) => ({ id: r.id, name: r.monitorName, key: r.monitorAgentKey }));
      }, name),
  };
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });
let createdId = null;
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const api = monitorApi(page);

  await login(page);
  assert("登录成功", !/\/login/.test(page.url()), page.url());

  // ---- 造夹具：带探针标识的临时监控资产（enabled=0，不进采集调度）----
  const created = await api.create({
    monitorName: NAME,
    monitorHost: "127.0.0.1",
    monitorPort: 8080,
    serviceType: "SERVER",
    monitorAgentKey: AGENT_KEY,
    monitorEnabled: 0,
    monitorDescription: "agent-route 配置弹窗真点验收夹具，验证后按 id 删除",
  });
  createdId = created.id;
  assert("临时监控资产已创建（含探针标识）",
    !!created.id && !!created.agentKey, JSON.stringify(created).slice(0, 160));

  // ---- 打开 /#/agents，等待夹具行出现 ----
  await page.goto(`${BASE}/#/agents`, { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  await page
    .waitForFunction((n) => document.body.innerText.includes(n), NAME, { timeout: 45000 })
    .catch(() => {});
  const rows = await page.evaluate(() => {
    const root = document.querySelector(".agent-list");
    return root ? root.querySelectorAll("tbody tr").length : -1;
  });
  const bodyTxt = await page.evaluate(() => document.body.innerText);
  assert("Agent 列表出现夹具行（探针标识可见）", rows > 0 && bodyTxt.includes(NAME) && bodyTxt.includes(AGENT_KEY),
    `rows=${rows}`);
  await page.screenshot({ path: path.join(OUT, "agent-list-with-fixture.png") });

  // ---- 真点夹具行「配置」按钮，断言 config 接口与弹窗 ----
  const cfgRespP = page
    .waitForResponse((r) => new RegExp(`/ms/monitor/agent/config/${createdId}`).test(r.url()), { timeout: 30000 })
    .catch(() => null);
  await page
    .locator(".agent-list tbody tr", { hasText: NAME })
    .first()
    .locator("button", { hasText: "配置" })
    .first()
    .click({ timeout: 15000 })
    .catch(() => {});
  const cfgResp = await cfgRespP;
  assert(`GET /ms/monitor/agent/config/${createdId} 已发出且 200`,
    !!cfgResp && cfgResp.status() === 200, cfgResp ? `status=${cfgResp.status()}` : "no request");
  await page.waitForTimeout(1500);
  const dlgTxt = await page.evaluate(() => document.body.innerText);
  assert("「Agent 配置」弹窗打开且含采集间隔/采集任务",
    dlgTxt.includes("Agent 配置") && dlgTxt.includes("采集间隔") && dlgTxt.includes("采集任务"));
  assert("弹窗展示采集间隔毫秒值", /采集间隔\s*\d+\s*ms/.test(dlgTxt.replace(/\s+/g, " ")) || /\d+ms/.test(dlgTxt),
    dlgTxt.slice(0, 80).replace(/\n/g, "|"));
  await page.screenshot({ path: path.join(OUT, "agent-config-dialog-fixture.png") });

  // ---- 关闭弹窗（无写入）----
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(600);
} finally {
  // ---- 还原：按精确 id 删除夹具并复核列表无残留 ----
  if (createdId != null) {
    try {
      const page2 = await browser.newPage({ viewport: { width: 1200, height: 800 } });
      const api2 = monitorApi(page2);
      await login(page2);
      const del = await api2.remove(createdId);
      log(`cleanup delete id=${createdId} → ${JSON.stringify(del)}`);
      const left = (await api2.listByName(NAME)).filter((r) => r.id === createdId);
      assert("夹具按精确 id 删除、无残留", left.length === 0, JSON.stringify(left));
      await page2.close().catch(() => {});
    } catch (e) {
      assert("夹具清理执行", false, String(e).slice(0, 120));
    }
  }
  await browser.close().catch(() => {});
}

const fails = results.filter((r) => !r.ok);
console.log("==== RESULT ====");
console.log(`total=${results.length} pass=${results.length - fails.length} fail=${fails.length}`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.name} | ${r.detail}`);
if (fails.length) process.exitCode = 1;
