// 判断节点专属表单（conditionForm.vue）的浏览器验收。
//
// 为什么要建临时流程：内置示例里没有判断节点，只有把带 condition 的 DSL 存进去，
// 设计器里才有可点选的判断节点。跑完删掉，不留数据。
//
// 断言分两条流程做，不靠往输入框里打字（试过，`.field:has-text()` 命中了
// 占位字段搜索框那个隐藏 input，超时且不能证明什么）：
//   流程 A：outputVariable 不写  → 提示应给出 ${conditionResult}（与后端默认名一致）
//   流程 B：outputVariable=ok   → 提示应变成 ${ok}，且不再出现 ${conditionResult}
// 这直接证明提示是跟着**当前参数值**算出来的，而不是写死的文案。
import { chromium } from "playwright";

const BASE = process.env.PW_BASE;
const API = "http://192.168.50.198:18190/collect/api";
const FLOW_A = "ZZ-ACC-CONDFORM-A";
const FLOW_B = "ZZ-ACC-CONDFORM-B";

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

/** 造一条带判断节点的流程；outputVariable 传 null 表示不写该参数。
 *  expression 特意让两条流程不同 —— 用它证明「当前打开的设计器确实是这一条」，
 *  否则残留的上一条设计器同样有 .flow-canvas，前提判断会失真（这个坑刚踩过）。 */
function dslFor(name, outputVariable, expression) {
  const varName = outputVariable || "conditionResult";
  const condParams = [{ name: "expression", value: expression }];
  if (outputVariable) condParams.push({ name: "outputVariable", value: outputVariable });
  return {
    name, threadCount: 1, headers: [], cookies: [], variables: [],
    nodes: [
      { id: "n1", shape: "start", name: "起点", x: 60, y: 120, params: [{ name: "urls", value: "https://example.com/" }], fields: [] },
      { id: "n2", shape: "condition", name: "判断节点", x: 260, y: 120, params: condParams, fields: [] },
      { id: "n3", shape: "end", name: "结束", x: 460, y: 120, params: [], fields: [] },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2", condition: "", exceptionFlow: "" },
      // 出边条件跟着结果变量名走，与流程语义一致
      { id: "e2", from: "n2", to: "n3", condition: "${" + varName + "}", exceptionFlow: "" },
    ],
  };
}
async function makeFlow(name, outputVariable, expression) {
  const r = await api("/v2/collect/flow/save", {
    method: "POST", headers: H,
    body: JSON.stringify({ collectFlowName: name, collectFlowCategoryId: 1, dsl: dslFor(name, outputVariable, expression) }),
  });
  console.log(`  建流程 ${name} -> success=${r?.success} flowId=${r?.data?.collectFlowId}`);
  return r?.data?.collectFlowId ?? null;
}
async function dropFlow(id) {
  if (!id) return;
  const r = await api(`/v2/collect/flow/delete?flowId=${id}`, { method: "DELETE", headers: H });
  console.log(`  删流程 id=${id} -> success=${r?.success}`);
}

const flowA = await makeFlow(FLOW_A, null, "1 == 1");
const flowB = await makeFlow(FLOW_B, "ok", "2 == 2");
if (!flowA || !flowB) { console.log("建流程失败，终止"); await dropFlow(flowA); await dropFlow(flowB); process.exit(2); }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));

/** 登录（按页面出现什么驱动，不看 hash）并确保流程列表真的出来了 */
async function ensureFlowList() {
  const ready = () =>
    page.evaluate(() => [...document.querySelectorAll("tr")].some((r) => (r.innerText || "").includes("示例-")));
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  for (let round = 0; round < 6; round++) {
    if ((await page.locator('input[type="password"]').count()) > 0) {
      console.log("== 在登录页，执行登录 ==");
      await page.locator('input[type="text"]').first().fill("admin");
      await page.locator('input[type="password"]').first().fill("123456");
      await page.locator("button", { hasText: "登录" }).first().click();
      await page.waitForTimeout(7000);
    }
    // 必须整页重载：本应用是页签外壳，自己记活动页签，只改 hash 不会切到流程设计页
    await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(5000);
    if (await ready()) return true;
    console.log(`  第 ${round + 1} 轮列表未就绪`);
  }
  return false;
}

/** 打开某条流程的设计器并选中判断节点；返回整页文本 */
async function openDesignerAndSelect(flowName) {
  // 先等目标行真的出现（上一条流程的设计器可能刚关，列表还在重渲染）
  await page.waitForFunction(
    (n) => [...document.querySelectorAll("tr")].some((r) => (r.innerText || "").includes(n)),
    flowName, { timeout: 60000 },
  ).catch(() => {});
  // 关掉可能残留的设计器（第二次打开时它会把 .flow-canvas 留在页面上，让前提判断失真）
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(1500);
  if ((await page.locator(".flow-canvas").count()) > 0) {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(2000);
  }
  let opened = false;
  for (let i = 0; i < 6 && !opened; i++) {
    await page.evaluate((name) => {
      const row = [...document.querySelectorAll("tr")].find((r) => r.offsetParent !== null && (r.innerText || "").includes(name));
      if (!row) return;
      row.querySelector("td")?.click();
      row.querySelector('button[aria-label="流程设计"]')?.click();
    }, flowName);
    await page.waitForTimeout(4500);
    opened = (await page.locator(".flow-canvas").count()) > 0;
  }
  if (!opened) return null;
  let selected = false;
  for (let i = 1; i <= 4 && !selected; i++) {
    await page.locator('.flow-canvas .x6-node[data-cell-id="n2"]').click({ force: true, timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    selected = (await page.evaluate(() => (document.body.innerText || ""))).includes("判断表达式");
  }
  if (!selected) return null;
  return page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " "));
}

try {
  console.log("\n=== 前提：登录并进入流程列表 ===");
  const listOk = await ensureFlowList();
  ck("已登录且流程列表加载（有含「示例-」的流程行）", listOk, "");
  if (!listOk) throw new Error("流程列表未就绪");

  console.log("\n=== 流程 A：未填结果变量名 → 提示用默认名 ===");
  const textA = await openDesignerAndSelect(FLOW_A);
  ck("前提：设计器打开且属性面板切到判断节点", Boolean(textA), textA ? "" : "canvas 或面板未就绪");
  if (textA) {
    const idx = textA.indexOf("出边条件怎么写");
    console.log("  提示块: " + (idx >= 0 ? textA.slice(idx, idx + 110) : "(未出现)"));
    ck("A: 出现判断节点专属表单的出边条件提示块", textA.includes("出边条件怎么写"), "");
    ck("A: 真分支写法按默认名给出 ${conditionResult}", textA.includes("${conditionResult}"), "");
    ck("A: 假分支写法给出 ${conditionResult == false}", textA.includes("${conditionResult == false}"), "");
  }

  console.log("\n=== 流程 B：结果变量名=ok → 提示跟着变 ===");
  // 回到列表再开第二条（当前在设计器里）
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(6000);
  const textB = await openDesignerAndSelect(FLOW_B);
  const exprB = await page.evaluate(() => {
    const ta = [...document.querySelectorAll("textarea")].find((t) => (t.value || "").trim().length > 0);
    return ta ? ta.value.trim() : "";
  });
  ck("前提：第二条流程的设计器打开且选中判断节点", Boolean(textB) && exprB === "2 == 2",
    "canvas/面板就绪=" + Boolean(textB) + " 面板表达式=" + JSON.stringify(exprB));
  if (textB && exprB === "2 == 2") {
    const hintB = (() => {
      const idx = textB.indexOf("出边条件怎么写");
      return idx >= 0 ? textB.slice(idx, idx + 110) : "";
    })();
    console.log("  提示块: " + (hintB || "(未出现)"));
    // 只看提示块本身：整页里出现 ${conditionResult} 是合法的（出边条件、连线属性都会显示它），
    // 拿整页去判「不再出现默认名」会把正确渲染判成红（刚踩过）。
    ck("B: 提示按实际结果变量名给出 ${ok}", hintB.includes("${ok}"), "");
    ck("B: 提示块内不再出现默认名 ${conditionResult}", !hintB.includes("${conditionResult}"), "");
  }
  console.log("\npageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
} finally {
  await page.screenshot({ path: "D:/ch/project/Temp/opencode/condition-form.png" }).catch(() => {});
  await browser.close();
  console.log("\n=== 清理 ===");
  await dropFlow(flowA);
  await dropFlow(flowB);
  const list = await api("/v2/collect/flow/list", { headers: H });
  const names = (list?.data ?? []).map((f) => f.collectFlowName);
  ck("两条临时流程已删除，列表只剩原有示例", !names.includes(FLOW_A) && !names.includes(FLOW_B), names.join(", "));
}

console.log(`\n===== 判断节点专属表单验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
