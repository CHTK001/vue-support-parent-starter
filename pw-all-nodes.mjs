// 全节点表单验收：建一条含 15 种 shape 的临时流程，逐个点开属性面板，
// 断言每个节点都有「节点级说明」，且 sql / script 两个高危节点有警示条。
//
// 为什么要建流程：sql / script / sleep / dedup 等节点不在内置示例里，
// 不造出来就没法验它们的表单（用户要求「每个组件」都要配置清晰）。
// 跑完删除流程，不留数据。
import { chromium } from "playwright";

const BASE = process.env.PW_BASE;
const API = "http://192.168.50.198:18190/collect/api";
const FLOW = "ZZ-ACC-ALLFORMS";

let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

async function api(path, init = {}) {
  const r = await fetch(API + path, {
    ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(45000),
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
}
const login = await api("/v2/user/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "123456" }) });
const H = { Authorization: "Bearer " + login.data.accessToken };

// 一条链把所有 shape 串起来：验证器要求每个节点都能到达结束节点
const SHAPES = [
  ["n1", "start", "开始"],
  ["n2", "request", "抓取"],
  ["n3", "extract", "抽取"],
  ["n4", "database", "写库"],
  ["n5", "sql", "SQL"],
  ["n6", "script", "脚本"],
  ["n7", "sleep", "等待"],
  ["n8", "variable", "变量"],
  ["n9", "dedup", "去重"],
  ["n10", "link", "链接"],
  ["n11", "process", "子流程"],
  ["n12", "output", "输出"],
  ["n13", "comment", "注释"],
  ["n14", "condition", "判断"],
  ["n15", "end", "结束"],
];
const nodes = SHAPES.map(([id, shape, name], i) => ({
  id, shape, name, x: 60 + (i % 8) * 150, y: 60 + Math.floor(i / 8) * 160, params: [], fields: [],
}));
// 必填项给最小可用值，避免保存校验拒绝
const setParam = (id, name, value) => {
  const node = nodes.find((n) => n.id === id);
  node.params.push({ name, value });
};
setParam("n1", "urls", "https://example.com/");
setParam("n2", "url", "${url}");
setParam("n3", "source", "${resp}");
setParam("n4", "table", "zz_acc_allforms");
setParam("n5", "statement", "select 1 as a");
setParam("n6", "script", "return 1");
const edges = [];
for (let i = 1; i < SHAPES.length; i++) {
  edges.push({ id: `e${i}`, from: `n${i}`, to: `n${i + 1}`, condition: "", exceptionFlow: "" });
}
const dsl = { name: FLOW, threadCount: 1, headers: [], cookies: [], variables: [], nodes, edges };

console.log("=== 建含 15 种节点的临时流程 ===");
const saved = await api("/v2/collect/flow/save", {
  method: "POST", headers: H,
  body: JSON.stringify({ collectFlowName: FLOW, collectFlowCategoryId: 1, dsl }),
});
console.log("  success=" + saved?.success + " msg=" + saved?.msg + " flowId=" + saved?.data?.collectFlowId);
const flowId = saved?.data?.collectFlowId;
if (!flowId) { console.log("建流程失败："); console.log(JSON.stringify(saved).slice(0, 500)); process.exit(2); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));

const flowListReady = () =>
  page.evaluate(() => [...document.querySelectorAll("tr")].some((r) => (r.innerText || "").includes("示例-")));

try {
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  let ready = false;
  for (let round = 0; round < 6 && !ready; round++) {
    if ((await page.locator('input[type="password"]').count()) > 0) {
      await page.locator('input[type="text"]').first().fill("admin");
      await page.locator('input[type="password"]').first().fill("123456");
      await page.locator("button", { hasText: "登录" }).first().click();
      await page.waitForTimeout(7000);
    }
    await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(5000);
    ready = await flowListReady();
  }
  ck("前提：登录并进入流程列表", ready);
  if (!ready) throw new Error("列表未就绪");

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
  if (!opened) throw new Error("设计器未打开");

  console.log("\n=== 逐个点开 15 种节点，检查「配置是否清晰」 ===");
  for (const [id, shape] of SHAPES) {
    let ok = false;
    for (let i = 0; i < 4 && !ok; i++) {
      await page.locator(`.flow-canvas .x6-node[data-cell-id="${id}"]`).click({ force: true, timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1500);
      ok = await page.evaluate((n) => (document.body.innerText || "").includes(n), SHAPES.find((s) => s[0] === id)[2]);
    }
    if (!ok) { ck(`${shape}（${id}）面板可点开`, false); continue; }
    const info = await page.evaluate(() => ({
      text: (document.body.innerText || "").replace(/\s+/g, " "),
      tips: document.querySelectorAll(".field-tip, .node-intro, .group-hint, .advanced-hint").length,
      intro: document.querySelectorAll(".node-intro").length,
      danger: document.querySelectorAll(".node-danger").length,
    }));
    const head = info.text.slice(0, 150);
    console.log(`  [${shape}] tips=${info.tips} intro=${info.intro} danger=${info.danger}`);
    console.log(`      ${head}`);
    ck(`${shape}：有参数/节点说明（tips>0）`, info.tips > 0, "tips=" + info.tips);
    if (shape === "sql" || shape === "script") {
      ck(`${shape}：有高危警示条`, info.danger > 0, "danger=" + info.danger);
      ck(`${shape}：警示说明了「等于交出服务器权限/任意执行」`, /任意|服务器|权限|不做语句白名单|注入/.test(info.text), "");
    }
  }

  console.log("\n=== B6. 属性面板：弹窗按钮 ===");
  // 面板已由 ReFlowGraph 外壳支持拖拽调宽（.flow-props-head 上 @mousedown="startResize"，限 240-720px），
  // 这里验新增的「弹窗」入口：面板窄/收起时也能编辑同一份 #properties 内容。
  const popupBtn = page.locator('button[aria-label^="弹窗配置"]').first();
  ck("面板头部有「弹窗」按钮", (await popupBtn.count()) > 0, "找到数=" + (await popupBtn.count()));
  if (await popupBtn.count()) {
    await popupBtn.click({ force: true });
    await page.waitForTimeout(1800);
    const popupForms = await page.locator(".flow-props-body--popup .node-intro").count();
    console.log(`  弹窗内表单实例=${popupForms}`);
    ck("点「弹窗」后弹出的对话框里有同一份表单", popupForms > 0, "实例=" + popupForms);
    // 关闭后弹窗内的实例必须消失（否则页面上会残留隐藏的第二份表单，自动化会点错）
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1500);
    const leftover = await page.locator(".flow-props-body--popup").count();
    ck("关闭后不残留第二份表单实例", leftover === 0, "残留=" + leftover);
  }

  console.log("\npageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
  await page.screenshot({ path: "D:/ch/project/vue-support-parent-starter/forms-all-nodes.png" }).catch(() => {});
} finally {
  await browser.close();
  console.log("\n=== 清理：删掉临时流程 ===");
  const del = await api(`/v2/collect/flow/delete?flowId=${flowId}`, { method: "DELETE", headers: H });
  console.log("  删除 success=" + del?.success);
  const list = await api("/v2/collect/flow/list", { headers: H });
  const names = (list?.data ?? []).map((f) => f.collectFlowName);
  ck("临时流程已删除", !names.includes(FLOW), names.join(", "));
}

console.log(`\n===== 全节点表单验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
