// 元素拾取器验收。
//
// 教训（都写在这，避免重犯）：
//  ① 选流程必须按**精确流程名**，且「流程设计」按钮必须取**目标行内部**那个 ——
//     全局取第一个会点到别的行，导致「选中的流程」与「打开的流程」不一致。
//  ② 断言前先验前提（面板是否切到抽取节点、画布是否有 n3），否则失败原因全是噪声。
//  ③ 页面上有**两个对话框**（设计器 + 拾取器），断言一律用拾取器独有的 class 做锚点
//     （.picker-bar / .picker-code），不要用 .el-dialog 这种两者都命中的选择器。
import { chromium } from "playwright";
const BASE = process.env.PW_BASE;
const FLOW_NAME = "示例-GitHub 项目采集";
const URL_UNDER_TEST = "https://example.com/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(4000);
// 登录按「页面上出现什么」驱动，不看 location.hash：
// 旧写法在第 1 次登录成功后页面已离开登录页，第二轮仍去 fill 已消失的输入框而超时（实测踩过）。
// 就绪判据也必须是有真实流程行，不能只数 tr —— 空表的表头行也会满足。
const flowListReady = () =>
  page.evaluate(() => [...document.querySelectorAll("tr")].some((r) => (r.innerText || "").includes("示例-")));
let loggedIn = false;
for (let round = 0; round < 6 && !loggedIn; round++) {
  if ((await page.locator('input[type="password"]').count()) > 0) {
    console.log(`== 登录（第 ${round + 1} 轮）==`);
    // 凭据来自 198 服务器自带的 /opt/collect/README.md：本地 H2 的 sa/admin123 在 MySQL 上不存在
    await page.locator('input[type="text"]').first().fill("admin");
    await page.locator('input[type="password"]').first().fill("123456");
    await page.locator("button", { hasText: "登录" }).first().click();
    await page.waitForTimeout(7000);
  }
  // 必须整页重载：本应用是页签外壳，自己记活动页签，只改 hash 不会切到流程设计页
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);
  loggedIn = await flowListReady();
}
if (!loggedIn) {
  console.log("流程列表未就绪，后续断言全是噪声，提前结束");
  await browser.close();
  process.exit(1);
}

console.log("=== 0. 打开设计器（按精确流程名 + 行内按钮）===");
let opened = false;
for (let i = 0; i < 4 && !opened; i++) {
  await page.evaluate((name) => {
    const row = [...document.querySelectorAll("tr")].find((r) => r.offsetParent !== null && (r.innerText || "").includes(name));
    if (!row) return;
    row.querySelector("td")?.click();
    row.querySelector('button[aria-label="流程设计"]')?.click();
  }, FLOW_NAME);
  try {
    await page.waitForSelector(".flow-canvas", { timeout: 10000 });
    if ((await page.locator(".flow-canvas .x6-node").count()) > 0) opened = true;
  } catch { await page.waitForTimeout(2000); }
}
if (!opened) { console.log("  设计器未打开"); await browser.close(); process.exit(1); }
await page.waitForTimeout(4500);
const hasN3 = (await page.locator('.flow-canvas .x6-node[data-cell-id="n3"]').count()) > 0;
ck("前提：流程里有抽取节点 n3", hasN3, "");
if (!hasN3) { await browser.close(); process.exit(1); }

console.log("\n=== 1. 选中抽取节点（先验前提）===");
let selected = false;
for (let i = 1; i <= 4 && !selected; i++) {
  await page.locator('.flow-canvas .x6-node[data-cell-id="n3"]').click({ force: true, timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  selected = (await page.evaluate(() => (document.body.innerText || ""))).includes("抽取字段");
}
ck("前提：属性面板已切到抽取节点", selected, "");
if (!selected) { await browser.close(); process.exit(1); }
console.log("  字段行数=" + (await page.locator(".collect-field-card").count()));

console.log("\n=== 2. 「选取页面元素」入口 ===");
// 抽取字段已收进弹框：先点「配置」打开（摘要行文本形如「11 个字段（JSON）」，
// 与字段映射的「3 条（…）」区分开，免得点到别的配置按钮）
const summaryBtn = page.locator(".field-summary").filter({ hasText: "个字段" }).locator("button").first();
if (await summaryBtn.count()) {
  await summaryBtn.click({ force: true });
  await page.waitForTimeout(1800);
}
const cardsInDialog = await page.locator(".collect-field-card").count();
console.log("  弹框内字段行数=" + cardsInDialog);
ck("抽取字段弹框已打开", cardsInDialog > 0, "行数=" + cardsInDialog);
if (cardsInDialog === 0) { console.log("字段弹框未打开，后续断言无意义"); await browser.close(); process.exit(1); }
// 内置示例的字段 parserType 全被上游污染成 CLOB，按设计只有 CSS/XPATH 行才给入口 ——
// 所以先加一个字段（默认 CSS）来验
await page.locator("button", { hasText: "添加字段" }).first().click({ force: true });
await page.waitForTimeout(1500);
const btnCount = await page.locator("button", { hasText: "选取页面元素" }).count();
ck("CSS 行出现「选取页面元素」按钮（CLOB 行按设计不出现）", btnCount > 0, "按钮数=" + btnCount);
if (btnCount === 0) { await browser.close(); process.exit(1); }

console.log("\n=== 3. 打开拾取器并抓取 ===");
await page.locator("button", { hasText: "选取页面元素" }).first().click({ force: true });
await page.waitForSelector(".picker-bar", { timeout: 15000 });
ck("拾取器弹窗已打开（.picker-bar 出现）", true, "");
const prefilled = await page.locator(".picker-bar input").first().inputValue();
console.log(`  预填地址 = "${prefilled}"`);
ck("预填地址来自上游抓取节点（可能含 ${} 占位符）", prefilled.length > 0, JSON.stringify(prefilled));

await page.locator(".picker-bar input").first().fill(URL_UNDER_TEST);
await page.locator("button", { hasText: "抓取并渲染" }).first().click({ force: true });
await page.waitForTimeout(6000);
ck("预览 iframe 已渲染", (await page.locator("iframe.picker-frame").count()) === 1, "");
const frame = page.frameLocator("iframe.picker-frame");
const anchorCount = await frame.locator("a").count().catch(() => -1);
ck("iframe 内取到页面元素（<a> 数 > 0）", anchorCount > 0, "<a> 数=" + anchorCount);

console.log("\n=== 4. 点选元素并生成选择器 ===");
await frame.locator("a").first().click();
await page.waitForTimeout(1500);
// 用拾取器独有的 .picker-code 做锚点（不要用 .el-dialog，页面上有两个对话框）
const codes = await page.$$eval("code.picker-code", (els) => els.map((e) => (e.textContent || "").trim()));
console.log("  CSS=" + JSON.stringify(codes[0]) + "  XPath=" + JSON.stringify(codes[1]));
ck("生成了 CSS 选择器", (codes[0] ?? "").length > 0 && codes[0] !== "—", JSON.stringify(codes[0]));
ck("生成了 XPath（/html 开头的绝对路径）", /^\/html/.test(codes[1] ?? ""), JSON.stringify(codes[1]));

console.log("\n=== 5. 插入并回写 ===");
const rowState = () => page.$$eval(".collect-field-card", (cards) => {
  const last = cards[cards.length - 1];
  const inputs = [...(last?.querySelectorAll("input") || [])].map((el) => ({
    ph: el.getAttribute("placeholder") || "",
    v: el.value || "",
  }));
  // 按 placeholder 定位表达式框，不能写死下标：切到 XPATH 后属性下拉被 v-if 移除，
  // 后面的输入框会整体前移一位（曾因此把「表达式为空」误判成产品缺陷）。
  const exprBox = inputs.find((i) => i.ph.startsWith("表达式"));
  // 解析器那一列从 .head-parser 改名为 .cell-parser（字段表改成列头+网格后），
  // 仍按语义取该列文本，不要退回按输入框下标取。
  return {
    parser: (last?.querySelector(".cell-parser")?.innerText || "").trim(),
    expr: exprBox?.v || "",
    allInputs: inputs,
    cardText: (last?.innerText || "").replace(/\s+/g, " ").slice(0, 160),
  };
});
console.log("  插入前（新增的末行）: " + JSON.stringify(await rowState()));
await page.locator("button", { hasText: "用 XPath 插入" }).first().click({ force: true });
await page.waitForTimeout(2000);
ck("插入后拾取器关闭", (await page.locator(".picker-bar").count()) === 0, "picker-bar 数=" + (await page.locator(".picker-bar").count()));
const after = await rowState();
console.log("  插入后（新增的末行）: " + JSON.stringify(after));
ck("该行表达式被写成绝对路径 XPath", /^\/html/.test(after.expr), JSON.stringify(after.expr));
ck("该行 parserType 被改成 XPATH", after.parser.toUpperCase().includes("XPATH"), JSON.stringify(after.parser));

console.log(`\n===== 拾取器验收：${pass} 通过 / ${fail} 失败 =====`);
console.log("pageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
await page.screenshot({ path: "D:/ch/project/Temp/opencode/picker.png" });
await browser.close();
process.exit(fail > 0 ? 1 : 0);
