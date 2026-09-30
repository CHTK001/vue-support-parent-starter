// 第 4 项：端到端业务闭环 —— 全程在浏览器里操作：打开流程 → 点「运行」 → 核对结果落库。
//
// 与之前的引擎级 dry-run 验收不同：这里是「界面点运行 → 服务端真跑 → 数据真写进表」的完整链路。
// 用草表 zz_e2e（跑完删掉），流程用临时 ZZ-E2E（跑完删掉）。
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const BASE = process.env.PW_BASE;
const API = "http://192.168.50.198:18190/collect/api";
const PLINK = "C:\\Program Files\\PuTTY\\plink.exe";
const HK = "ssh-ed25519 255 SHA256:+1fng3xnq68Cacd77WZi7mZD6mn12lRQdH7dpvgdwrk";
const FLOW = "ZZ-E2E";
const TABLE = "zz_e2e";

let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

function remoteBash(script) {
  return new Promise((resolve) => {
    const p = spawn(PLINK, ["-batch", "-no-antispoof", "-hostkey", HK, "-pw", "kali",
      "kali@192.168.50.198", "sudo -S bash -s"], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", () => resolve(out + (err.trim() ? "\n[stderr] " + err.trim() : "")));
    p.stdin.write("kali\n" + script);
    p.stdin.end();
  });
}
const mysql = (sql) => remoteBash(`sudo -n mysql collect -e ${JSON.stringify(sql)} 2>&1\n`);
async function api(path, init = {}) {
  const r = await fetch(API + path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(60000) });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
}
const login = await api("/v2/user/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "123456" }) });
const H = { Authorization: "Bearer " + login.data.accessToken };

console.log("=== 0. 造草表与临时流程 ===");
const pre = await mysql(`select count(*) from information_schema.tables where table_schema='collect' and table_name='${TABLE}'`);
if (!/\b0\b/.test(pre)) { console.log("草表被占用，终止"); process.exit(2); }
console.log(await mysql(`create table ${TABLE} (href varchar(255) primary key, title varchar(255))`));

const p = (name, value) => ({ name, value });
const dsl = {
  name: FLOW, threadCount: 1, headers: [], cookies: [], variables: [],
  nodes: [
    { id: "n1", shape: "start", name: "起点", x: 60, y: 120, params: [p("urls", "https://example.com/")], fields: [] },
    { id: "n2", shape: "request", name: "抓取", x: 220, y: 120, params: [p("url", "${url}"), p("method", "GET"), p("outputVariable", "resp")], fields: [] },
    { id: "n3", shape: "extract", name: "抽取", x: 380, y: 120, params: [p("source", "${respDoc}"), p("mode", "single"), p("outputVariable", "rows")], fields: [
      { name: "title", parserType: "CSS", expression: "a", attribute: "text" },
      { name: "href", parserType: "XPATH", expression: "/html[1]/body[1]/a[1]/@href" },
    ] },
    { id: "n4", shape: "database", name: "写库", x: 540, y: 120, params: [
      p("source", "${rows}"), p("table", TABLE), p("mode", "update"), p("batchSize", "200"),
      p("column:href", "${href}"), p("column:title", "${title}"), p("key:href", "1"),
    ], fields: [] },
    { id: "n5", shape: "end", name: "结束", x: 700, y: 120, params: [], fields: [] },
  ],
  edges: [
    { id: "e1", from: "n1", to: "n2", condition: "", exceptionFlow: "" },
    { id: "e2", from: "n2", to: "n3", condition: "", exceptionFlow: "" },
    { id: "e3", from: "n3", to: "n4", condition: "", exceptionFlow: "" },
    { id: "e4", from: "n4", to: "n5", condition: "", exceptionFlow: "" },
  ],
};
const saved = await api("/v2/collect/flow/save", { method: "POST", headers: H, body: JSON.stringify({ collectFlowName: FLOW, collectFlowCategoryId: 1, dsl }) });
console.log("  建流程 flowId=" + saved?.data?.collectFlowId + " success=" + saved?.success);
const flowId = saved?.data?.collectFlowId;
if (!flowId) { console.log(JSON.stringify(saved).slice(0, 300)); process.exit(2); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));

try {
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  const ready = () => page.evaluate(() => [...document.querySelectorAll("tr")].some((r) => (r.innerText || "").includes("示例-")));
  let ok = false;
  for (let round = 0; round < 6 && !ok; round++) {
    if ((await page.locator('input[type="password"]').count()) > 0) {
      await page.locator('input[type="text"]').first().fill("admin");
      await page.locator('input[type="password"]').first().fill("123456");
      await page.locator("button", { hasText: "登录" }).first().click();
      await page.waitForTimeout(7000);
    }
    await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(5000);
    ok = await ready();
  }
  ck("前提：登录并进入流程列表", ok);

  console.log("\n=== 1. 打开这条流程的设计器（点运行需要先选中流程）===");
  let opened = false;
  for (let i = 0; i < 5 && !opened; i++) {
    await page.evaluate((name) => {
      const row = [...document.querySelectorAll("tr")].find((r) => r.offsetParent !== null && (r.innerText || "").includes(name));
      if (!row) return;
      row.querySelector("td")?.click();
      row.querySelector('button[aria-label="流程设计"]')?.click();
    }, FLOW);
    await page.waitForTimeout(4500);
    opened = (await page.locator(".flow-canvas").count()) > 0;
  }
  ck("前提：设计器已打开", opened);

  console.log("\n=== 2. 在界面上点「运行」 ===");
  // 设计器是以弹层打开的，页级运行条会被盖住；force click 会把事件交给上层遮罩，等于没点。
  // 先关掉弹层（currentId 已由打开动作设好），再点「可见的」运行按钮。
  await page.keyboard.press("Escape");
  await page.waitForTimeout(2500);
  const runBtn = page.locator('button[aria-label="运行"]:visible').first();
  const btnCount = await runBtn.count();
  console.log("  可见运行按钮数 = " + btnCount + "，disabled=" + (btnCount ? await runBtn.isDisabled() : "(无)"));
  ck("找到并可用「运行」按钮", btnCount > 0 && !(await runBtn.isDisabled()), "");
  await runBtn.click();
  await page.waitForTimeout(6000);
  const toast = await page.evaluate(() => {
    const el = document.querySelector(".el-message");
    return el ? (el.innerText || "").replace(/\s+/g, " ") : "";
  });
  console.log("  提交后的提示: " + (toast || "(无)"));

  console.log("\n=== 3. 核对任务（界面提交后服务端真跑）===");
  let task = null;
  for (let i = 0; i < 40 && !task; i++) {
    await page.waitForTimeout(2000);
    const pageTasks = await api("/v2/collect/task/page?pageNum=1&pageSize=20", { headers: H });
    const rows = pageTasks?.data?.data?.data ?? pageTasks?.data?.data ?? [];
    task = (Array.isArray(rows) ? rows : []).find((r) => String(r.collectTaskFlowName || "") === FLOW);
  }
  if (!task) {
    ck("界面上点运行后产生了任务", false, "未查到");
  } else {
    console.log("  任务: " + JSON.stringify(task).slice(0, 240));
    ck("界面上点运行后产生了任务", true, "taskNo=" + task.collectTaskNo + " 触发=" + task.collectTaskTriggerType);
    ck("触发方式来自手工运行（非 TEST/CRON）", !/TEST|CRON/i.test(String(task.collectTaskTriggerType)), String(task.collectTaskTriggerType));
    let d = null;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      d = (await api(`/v2/collect/task/detail?taskId=${task.collectTaskId}`, { headers: H }))?.data;
      if (d && /SUCCESS|FAIL|STOP/i.test(String(d.collectTaskStatus))) break;
    }
    // 取证必须在清理之前：上一轮就是先清理后取证，失败原因丢了。
    const logs = (await api(`/v2/collect/task/logs?taskId=${task.collectTaskId}`, { headers: H }))?.data ?? [];
    console.log("  ---- 节点日志（清理前取证）----");
    for (const l of logs) {
      console.log(`     | ${l.collectTaskLogNodeId} ${l.collectTaskLogNodeShape} ${l.collectTaskLogStatus} ${String(l.collectTaskLogMessage ?? "").replace(/\s+/g, " ").slice(0, 220)}`);
    }
    console.log("  任务详情: " + JSON.stringify(d).slice(0, 320));
    console.log("  提交的节点参数（便于与日志对照）:");
    for (const n of dsl.nodes) {
      console.log(`     ${n.id}(${n.shape}) params=${JSON.stringify(n.params)} fields=${n.fields?.length ?? 0}`);
    }
    ck("任务跑完且成功", /SUCCESS/i.test(String(d?.collectTaskStatus)), "status=" + d?.collectTaskStatus);
  }

  console.log("\n=== 4. 核对数据真落库 ===");
  const rows = await mysql(`select href, title from ${TABLE}`);
  console.log("  表内容: " + rows.replace(/\s+/g, " ").trim());
  ck("草表里出现抓取结果", /iana\.org/.test(rows), rows.replace(/\s+/g, " ").trim().slice(0, 120));
  // 断言用页面上真实存在的元素：198 抓到的 example.com 变体里没有 <h1>
  // （CSS 与 XPath 取 h1 都是 NULL，而 body/a 都能取到），拿 h1 断言会得到假红。
  ck("文本也被抽到了（a 的可见文本）", /Learn more/i.test(rows), "");

  console.log("\npageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
  await page.screenshot({ path: "D:/ch/project/vue-support-parent-starter/e2e-run.png" }).catch(() => {});
} finally {
  await browser.close();
  console.log("\n=== 5. 清理 ===");
  const tasks = await api("/v2/collect/task/page?pageNum=1&pageSize=50", { headers: H });
  const list = tasks?.data?.data?.data ?? tasks?.data?.data ?? [];
  for (const r of (Array.isArray(list) ? list : []).filter((x) => String(x.collectTaskFlowName || "") === FLOW)) {
    await api(`/v2/collect/task/delete?taskId=${r.collectTaskId}`, { method: "DELETE", headers: H });
  }
  const del = await api(`/v2/collect/flow/delete?flowId=${flowId}`, { method: "DELETE", headers: H });
  console.log("  删流程 success=" + del?.success);
  console.log((await mysql(`drop table if exists ${TABLE}`)).trim() || "  草表已删");
  const names = ((await api("/v2/collect/flow/list", { headers: H }))?.data ?? []).map((f) => f.collectFlowName);
  ck("临时流程与草表已清理", !names.includes(FLOW), names.join(", "));
}
console.log(`\n===== 端到端闭环验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
