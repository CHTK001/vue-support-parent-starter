// 复现用户报的三个问题：顶部删除、GitHub 示例节点重复渲染/堆叠、线与节点位置。
// 纯 ASCII：本机 PowerShell 5.1 按 GBK 读无 BOM 的 .mjs 不影响，但输出中文需 UTF-8。
import { chromium } from "playwright";

const BASE = process.env.PW_BASE || "http://localhost:19096";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));

// 登录
await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => {
  const a = document.querySelector("#app");
  return !!a && a.children.length > 0 && (document.body.innerText || "").length > 50;
}, null, { timeout: 180000 });

if ((await page.locator('input[type="password"]').count()) > 0) {
  console.log("== 登录 ==");
  await page.locator('input[type="text"]').first().fill("sa");
  await page.locator('input[type="password"]').first().fill("123456");
  await page.locator("button").filter({ hasText: "登录" }).first().click();
  await page.waitForTimeout(8000);
  await page.goto(`${BASE}/#/collect/design`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => (document.body.innerText || "").length > 50, null, { timeout: 120000 });
}
await page.waitForTimeout(4000);
console.log("hash =", await page.evaluate(() => location.hash));

// ---- 顶部工具条：把每个按钮的文案与可用状态打出来 ----
console.log("");
console.log("== 1. 顶部工具条按钮 ==");
const toolbar = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("button").forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.top > 120 || r.width === 0) return; // 只要顶部区域
    out.push({
      text: (b.innerText || "").trim().slice(0, 20),
      aria: b.getAttribute("aria-label"),
      disabled: b.disabled === true || b.className.includes("is-disabled"),
      top: Math.round(r.top),
      left: Math.round(r.left),
    });
  });
  return out;
});
toolbar.forEach((b) =>
  console.log(`  top=${b.top} left=${b.left} disabled=${b.disabled} text="${b.text}" aria="${b.aria}"`),
);

// ---- 左侧流程列表：找 GitHub 示例并打开流程设计 ----
console.log("");
console.log("== 2. 流程列表 ==");
const rows = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("tr, .el-table__row").forEach((tr) => {
    const t = (tr.innerText || "").replace(/\s+/g, " ").trim();
    if (t) out.push(t.slice(0, 80));
  });
  return out;
});
rows.forEach((r) => console.log("  " + r));

// 点开 GitHub 示例所在行
const clicked = await page.evaluate(() => {
  const cells = [...document.querySelectorAll("td, .el-table__row")];
  const hit = cells.find((c) => (c.innerText || "").includes("GitHub"));
  if (!hit) return false;
  const row = hit.closest("tr") || hit;
  (row.querySelector("td") || row).click();
  return true;
});
console.log("  点击 GitHub 行 =", clicked);
await page.waitForTimeout(2500);

// 打开设计器
const opened = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) =>
    /流程设计|设计|编辑/.test((x.innerText || "") + (x.getAttribute("aria-label") || "")),
  );
  if (b) { b.click(); return (b.innerText || b.getAttribute("aria-label") || "").trim(); }
  return null;
});
console.log("  打开设计器按钮 =", opened);
await page.waitForTimeout(6000);

// ---- 画布 DOM 实测 ----
console.log("");
console.log("== 3. 画布 DOM ==");
const dom = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll(".flow-canvas .x6-node")];
  const cards = [...document.querySelectorAll(".flow-canvas .flow-node-card")];
  const edges = [...document.querySelectorAll(".flow-canvas .x6-edge")];
  const fo = [...document.querySelectorAll(".flow-canvas foreignObject")];
  return {
    x6nodeCount: nodes.length,
    cardCount: cards.length,
    foreignObjectCount: fo.length,
    edgeCount: edges.length,
    perCell: nodes.map((n) => {
      const id = n.getAttribute("data-cell-id");
      const cards = n.querySelectorAll(".flow-node-card").length;
      const fo = n.querySelectorAll("foreignObject").length;
      const r = n.getBoundingClientRect();
      return {
        id,
        cards,
        fo,
        xf: n.getAttribute("transform"),
        box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      };
    }),
    cardTexts: cards.slice(0, 12).map((c) => (c.innerText || "").replace(/\s+/g, " ").trim().slice(0, 30)),
  };
});
console.log(`  .x6-node=${dom.x6nodeCount}  .flow-node-card=${dom.cardCount}  foreignObject=${dom.foreignObjectCount}  .x6-edge=${dom.edgeCount}`);
console.log("  卡片文案:", JSON.stringify(dom.cardTexts, null, 0));
console.log("  逐节点（id / 卡片数 / foreignObject 数 / transform / 屏幕盒）:");
dom.perCell.forEach((n) =>
  console.log(`    ${n.id}  cards=${n.cards} fo=${n.fo}  xf=${n.xf}  box=${JSON.stringify(n.box)}`),
);

await page.screenshot({ path: "D:/ch/project/Temp/opencode/shot-flow.png", fullPage: false });
console.log("");
console.log("  截图 -> Temp/opencode/shot-flow.png");
console.log("  pageerror:", pageErrors.length ? pageErrors.join(" | ") : "无");

await browser.close();
