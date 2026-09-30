// 验证「解析器类型裁剪 + 去掉重复说明」：
//   A. 把 198 上示例流程的 11 个 JSON 字段迁移成 JSONPATH（后端两者同一套点号路径）
//   B. 迁移后示例仍能跑通（抽取 10 行）
//   C. 浏览器：解析器下拉只剩 4 项（CSS / XPATH / JSONPATH / REGEX）
//   D. 浏览器：存量字段显示 JSONPATH，且下拉不会因为「值不在清单里」而渲染成空
//   E. 浏览器：属性面板不再出现 FlowDesigner 那块重复的 meta 描述（专属表单的 .node-intro 仍在）
import { chromium } from "playwright";

const BASE = process.env.PW_BASE;
const API = "http://192.168.50.198:18190/collect/api";
const FLOW = "示例-GitHub 项目采集";
let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

async function api(path, init = {}) {
  const r = await fetch(API + path, {
    ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(60000),
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
}
const login = await api("/v2/user/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "123456" }) });
const H = { Authorization: "Bearer " + login.data.accessToken };

// 取示例流程 id 与 meta 描述
const flows = (await api("/v2/collect/flow/list", { headers: H })).data ?? [];
const target = flows.find((f) => f.collectFlowName === FLOW);
const detail = (await api(`/v2/collect/flow/detail?flowId=${target.collectFlowId}`, { headers: H })).data;
const metas = (await api("/v2/collect/designer/metas", { headers: H })).data ?? [];
const extractDesc = metas.find((m) => m.shape === "extract")?.description ?? "";
console.log(`示例流程 flowId=${target.collectFlowId}；extract 的 meta 描述="${extractDesc}"`);

console.log("\n=== A. 迁移 JSON → JSONPATH ===");
let migrated = 0;
for (const n of detail.dsl.nodes ?? []) {
  for (const f of n.fields ?? []) {
    if (String(f.parserType).toUpperCase() === "JSON") { f.parserType = "JSONPATH"; migrated++; }
  }
}
console.log("  迁移字段数 = " + migrated);
if (migrated > 0) {
  const upd = await api("/v2/collect/flow/update", {
    method: "PUT", headers: H,
    body: JSON.stringify({
      collectFlowId: detail.collectFlowId,
      collectFlowName: detail.collectFlowName,
      collectFlowCategoryId: detail.collectFlowCategoryId,
      collectFlowCron: detail.collectFlowCron,
      collectFlowConcurrency: detail.collectFlowConcurrency,
      collectFlowThreadCount: detail.collectFlowThreadCount,
      collectFlowRemark: detail.collectFlowRemark,
      dsl: detail.dsl,
    }),
  });
  ck("示例流程已更新为 JSONPATH", upd?.success === true, "success=" + upd?.success + " msg=" + upd?.msg);
}
const after = (await api(`/v2/collect/flow/detail?flowId=${detail.collectFlowId}`, { headers: H })).data;
const types = [...new Set((after.dsl.nodes ?? []).flatMap((n) => (n.fields ?? []).map((f) => String(f.parserType).toUpperCase())))];
console.log("  更新后字段类型: " + JSON.stringify(types));
ck("示例流程已无 JSON 类型（全部 JSONPATH）", !types.includes("JSON") && types.includes("JSONPATH"), JSON.stringify(types));

console.log("\n=== B. 迁移后示例仍能跑通 ===");
const run = await api("/v2/collect/execution/dry-run", { method: "POST", headers: H, body: JSON.stringify(after.dsl) });
const taskId = run?.data?.collectTaskId;
console.log("  taskId=" + taskId + " success=" + run?.success);
if (taskId) {
  let d = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((s) => setTimeout(s, 2000));
    d = (await api(`/v2/collect/task/detail?taskId=${taskId}`, { headers: H })).data;
    if (d && /SUCCESS|FAIL|STOP/i.test(String(d.collectTaskStatus))) break;
  }
  const logs = (await api(`/v2/collect/task/logs?taskId=${taskId}`, { headers: H })).data ?? [];
  const extractLog = logs.filter((l) => l.collectTaskLogNodeShape === "extract").map((l) => String(l.collectTaskLogMessage ?? "")).join(" ");
  console.log(`  任务状态=${d?.collectTaskStatus}  extract 日志: ${extractLog.slice(0, 120)}`);
  ck("示例仍跑通且抽到了 10 行", String(d?.collectTaskStatus).toUpperCase() === "SUCCESS" && /10/.test(extractLog), extractLog.slice(0, 80));
  await api(`/v2/collect/task/delete?taskId=${taskId}`, { method: "DELETE", headers: H });
} else {
  ck("示例提交成功", false, JSON.stringify(run).slice(0, 200));
}

console.log("\n=== C/D/E. 浏览器验证 ===");
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
  let sel = false;
  for (let i = 0; i < 4 && !sel; i++) {
    await page.locator('.flow-canvas .x6-node[data-cell-id="n3"]').click({ force: true, timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1800);
    sel = await page.evaluate(() => (document.body.innerText || "").includes("抽取字段"));
  }
  ck("前提：面板切到抽取节点", sel);

  // E：面板里不应再出现 FlowDesigner 那块 meta 描述（专属表单的 .node-intro 才是说明来源）
  const panelText = await page.evaluate(() => (document.querySelector(".pane-grid")?.innerText || "").replace(/\s+/g, " "));
  ck("E: 面板不再出现重复的 meta 描述", !panelText.includes(extractDesc), extractDesc ? "描述=" + extractDesc.slice(0, 20) : "(无描述)");
  ck("E: 专属表单的节点说明仍在（.node-intro）", (await page.locator(".node-intro").count()) > 0, "node-intro=" + (await page.locator(".node-intro").count()));

  // 打开字段弹框看下拉
  const summary = page.locator(".field-summary").filter({ hasText: "个字段" }).first();
  if (await summary.count()) {
    await summary.locator("button").first().click({ force: true });
    await page.waitForTimeout(1800);
  }
  const cards = await page.locator(".collect-field-card").count();
  ck("字段弹框已打开", cards > 0, "行数=" + cards);

  // D：存量字段应显示 JSONPATH（不是空）
  const shown = await page.evaluate(() => {
    const cell = document.querySelector(".collect-field-card .cell-parser");
    return cell ? cell.innerText.trim() : "";
  });
  console.log("  首行解析器显示: " + JSON.stringify(shown));
  ck("D: 存量字段显示 JSONPATH（迁移生效且非空）", /JSONPATH/i.test(shown), shown);

  // C：点开下拉数选项。必须只取「刚点开的那个」下拉：
  // 页面上每个字段行、属性选择器、分类筛选都各有一个下拉，全页收集会把它们混在一起
  // （上一轮就是这么错的，得到 100 多项）。
  await page.locator(".collect-field-card .cell-parser").first().click({ force: true });
  await page.waitForTimeout(1200);
  const opts = await page.evaluate(() => {
    const drops = [...document.querySelectorAll(".el-select-dropdown")].filter((d) => d.offsetParent !== null);
    const last = drops[drops.length - 1];
    return last
      ? [...last.querySelectorAll(".el-select-dropdown__item")].map((e) => (e.innerText || "").trim()).filter(Boolean)
      : [];
  });
  console.log("  刚点开的下拉选项: " + JSON.stringify(opts));
  ck("C: 解析器下拉恰为 4 项（CSS/XPATH/JSONPATH/REGEX）", opts.length === 4, JSON.stringify(opts));
  ck("C: 不含 TEXT / HTML", !opts.some((o) => /^(TEXT|HTML)$/i.test(o)), JSON.stringify(opts));
  console.log("\npageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
} finally {
  await page.screenshot({ path: "D:/ch/project/vue-support-parent-starter/parser-trim.png" }).catch(() => {});
  await browser.close();
}
console.log(`\n===== 类型裁剪验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
