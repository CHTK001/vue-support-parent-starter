// 验收：抽取字段的表达式行现在能直接看到并插入上游变量（用户 1/1.1 的诉求）。
//
// 断言链：
//   a) 抽取节点的每个字段行都出现占位插入图标（.expr-picker）
//   b) 点开后弹层里的分组来自**图上的上游节点**（含「来自「…」」的说明），
//      而不是静态的全局变量列表
//   c) 点一个占位项，表达式输入框被追加了 ${...}
import { chromium } from "playwright";

const BASE = process.env.PW_BASE;
const FLOW = "示例-GitHub 项目采集";
let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

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
      console.log("== 登录 ==");
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
  ck("前提：已登录且流程列表加载", ready);
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

  let selected = false;
  for (let i = 1; i <= 4 && !selected; i++) {
    await page.locator('.flow-canvas .x6-node[data-cell-id="n3"]').click({ force: true, timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    selected = (await page.evaluate(() => (document.body.innerText || ""))).includes("抽取字段");
  }
  ck("前提：属性面板切到抽取节点", selected);
  if (!selected) throw new Error("面板未切换");

  const cardCount0 = await page.locator(".collect-field-card").count();
  if (cardCount0 === 0) {
    // 抽取字段已收进弹框：先点摘要行上的「配置」打开
    const summaryBtn = page.locator(".field-summary").filter({ hasText: "个字段" }).locator("button").first();
    if (await summaryBtn.count()) {
      await summaryBtn.click({ force: true });
      await page.waitForTimeout(1800);
    }
  }
  const cardCount = await page.locator(".collect-field-card").count();
  const pickerCount = await page.locator(".collect-field-card .expr-picker").count();
  console.log(`  字段行=${cardCount}  带占位入口的行=${pickerCount}`);
  ck("每个抽取字段行都有占位插入入口", pickerCount > 0 && pickerCount >= cardCount, `${pickerCount}/${cardCount}`);

  console.log("\n=== 打开占位弹层 ===");
  await page.locator(".collect-field-card .expr-picker").first().click({ force: true });
  await page.waitForTimeout(2000);
  // 每个字段行都有自己的 picker，页面上会有十几个 .el-popover（多数是隐藏的）——
  // 必须只取**可见**的那个，否则 .first() 会点到别的行上隐藏的弹层（实测 Element is not visible）。
  const pop = page.locator('.el-popover:visible', { has: page.locator('input[placeholder="搜索占位字段"]') });
  const popCount = await pop.count();
  const popText = popCount ? (await pop.first().innerText()).replace(/\s+/g, " ") : "";
  console.log("  可见弹层数=" + popCount);
  console.log("  弹层文本: " + popText.slice(0, 260));
  ck("弹层打开（含搜索框）", popCount > 0, "可见 popover 数=" + popCount);
  ck("分组来自图上的上游节点（含「来自「…」」说明）", /来自「/.test(popText), "");
  ck("能看到上游抓取节点的出参变量名 resp", /\bresp\b/.test(popText), "");

  console.log("\n=== 插入一个占位 ===");
  const before = await page.locator('.collect-field-card input[placeholder^="表达式"]').first().inputValue();
  const respItem = pop.first().locator("button.rpp-item", { hasText: "resp" }).first();
  const item = (await respItem.count()) > 0 ? respItem : pop.first().locator("button.rpp-item").first();
  const itemText = (await item.innerText().catch(() => "")) || "";
  await item.click();
  await page.waitForTimeout(1500);
  const after = await page.locator('.collect-field-card input[placeholder^="表达式"]').first().inputValue();
  console.log(`  插入项="${itemText.replace(/\s+/g, " ").slice(0, 30)}"  表达式: "${before}" -> "${after}"`);
  ck("点选后表达式被追加 ${...}", /\$\{.+\}/.test(after) && after !== before, after.slice(0, 80));

  console.log("\npageerror: " + (errs.length ? errs.slice(0, 3).join(" || ") : "无"));
} finally {
  await page.screenshot({ path: "D:/ch/project/Temp/opencode/placeholder-in-extract.png" }).catch(() => {});
  await browser.close();
}

console.log(`\n===== 抽取字段占位入口验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
