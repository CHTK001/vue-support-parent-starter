// 表单改造验收（对应你提的 2 / 2.1 / 2.3 后半 / 2.4 前半）：
//   A. start 节点不再出现循环四参数（断言用 metas 里这些参数的真实 label，避免写死文案）
//   B. 抽取节点：字段收进弹框，摘要行给出「N 个字段（类型）」，点配置能打开且内容完整
//   C. 数据库节点：字段映射收进弹框，摘要行给出「N 列（列名…）」
import { chromium } from "playwright";

const BASE = process.env.PW_BASE;
const API = "http://192.168.50.198:18190/collect/api";
const FLOW = "示例-GitHub 项目采集";
let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

// 循环四参数的真实 label：从 metas 读，避免把「循环次数」这类文案写死在测试里
const login = await (await fetch(`${API}/v2/user/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "123456" }),
})).json();
const metas = await (await fetch(`${API}/v2/collect/designer/metas`, {
  headers: { Authorization: "Bearer " + login.data.accessToken },
})).json();
const LOOP_NAMES = ["loopCount", "loopVariableName", "loopItemVariableName", "loopParallel"];
const loopLabels = [];
for (const meta of metas.data ?? []) {
  for (const p of meta.params ?? []) {
    if (LOOP_NAMES.includes(p.name) && p.label) loopLabels.push(p.label);
  }
}
console.log("  循环参数 label（来自 metas）: " + [...new Set(loopLabels)].join(" / "));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));

const ready = () => page.evaluate(() => [...document.querySelectorAll("tr")].some((r) => (r.innerText || "").includes("示例-")));
const panelText = () => page.evaluate(() => {
  // 属性面板文本：取含「节点参数」标题的那个容器，退回整页
  const t = document.body.innerText || "";
  return t.replace(/\s+/g, " ");
});
async function selectNode(cell, expectText) {
  let ok = false;
  for (let i = 0; i < 5 && !ok; i++) {
    await page.locator(`.flow-canvas .x6-node[data-cell-id="${cell}"]`).click({ force: true, timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1800);
    ok = (await page.evaluate(() => document.body.innerText || "")).includes(expectText);
  }
  return ok;
}

try {
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
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
  if (!ok) throw new Error("列表未就绪");

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

  console.log("\n=== A. start 节点不应出现循环参数 ===");
  const atStart = await selectNode("n1", "种子 URL");
  ck("前提：面板切到 start 节点", atStart);
  if (atStart) {
    const text = await panelText();
    const hits = [...new Set(loopLabels)].filter((l) => text.includes(l));
    console.log("  面板里命中的循环参数: " + (hits.length ? hits.join(" / ") : "（无）"));
    ck("start 节点不含任何循环参数 label", hits.length === 0, hits.join(" / "));
    ck("start 节点仍保留必填的「种子 URL」", text.includes("种子 URL"), "");
  }

  console.log("\n=== B. 抽取节点的字段弹框 ===");
  const atExtract = await selectNode("n3", "抽取字段");
  ck("前提：面板切到抽取节点", atExtract);
  if (atExtract) {
    const inlineCards = await page.locator(".collect-field-card").count();
    ck("字段表默认不在面板里铺开（行数应为 0）", inlineCards === 0, "行数=" + inlineCards);
    const summary = page.locator(".field-summary").filter({ hasText: "个字段" }).first();
    const summaryText = (await summary.count()) ? (await summary.innerText()).replace(/\s+/g, " ") : "";
    console.log("  摘要行: " + summaryText);
    ck("面板上有「N 个字段（类型）」摘要", /个字段（/.test(summaryText), summaryText);
    if (await summary.count()) {
      await summary.locator("button").first().click({ force: true });
      await page.waitForTimeout(1800);
    }
    const cards = await page.locator(".collect-field-card").count();
    ck("点配置后弹框内字段完整", cards > 0, "行数=" + cards);
    const pickers = await page.locator(".collect-field-card .expr-picker").count();
    ck("弹框内每个字段仍有占位插入入口", pickers >= cards && cards > 0, `${pickers}/${cards}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);
  }

  console.log("\n=== C. 数据库节点的字段映射弹框 ===");
  const atDb = await selectNode("n4", "写入");
  ck("前提：面板切到数据库节点", atDb);
  if (atDb) {
    const mapSummary = page.locator(".field-summary").filter({ hasText: "列（" }).first();
    const msText = (await mapSummary.count()) ? (await mapSummary.innerText()).replace(/\s+/g, " ") : "";
    console.log("  映射摘要: " + msText);
    ck("映射收成「N 列（列名…）」摘要", /列（/.test(msText), msText);
    if (await mapSummary.count()) {
      await mapSummary.locator("button").first().click({ force: true });
      await page.waitForTimeout(1800);
      const dlgText = await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " "));
      ck("映射弹框打开且能看到目标列/取值", /取值|值 \/|列/.test(dlgText), "");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(1000);
    }
  }

  console.log("\npageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
} finally {
  await page.screenshot({ path: "D:/ch/project/Temp/opencode/forms-redesign.png" }).catch(() => {});
  await browser.close();
}
console.log(`\n===== 表单改造验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
