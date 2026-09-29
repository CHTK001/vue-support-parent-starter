/**
 * 年级下拉修复验收 + AI 组卷学段归一化回归
 *
 * 1) 编辑弹框年级下拉必须显示中文名（不是 "1".."6"）
 * 2) 直接点「编辑」（不先开组卷弹框）也必须有年级选项 —— 之前 createGrades 为空
 * 3) 历史数据 "三年级" 与新数据 "3" 两种写法都要能正确回显
 * 4) AI 组卷存的学段必须是中文名（修复后）
 */
import { chromium } from "playwright";

const BASE = "http://localhost:19093";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = [];
const chk = (n, ok, d = "") => {
  R.push({ n, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`);
};

const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 150)));
let pid = null;

const auth = () =>
  page.evaluate(() => {
    const raw = Object.keys(localStorage)
      .map((k) => [k, localStorage.getItem(k)])
      .find(([k, v]) => /token/i.test(k) && v && v.length > 60);
    return raw ? (raw[1].match(/[0-9a-zA-Z\-._~+/]{60,}=*/) || [raw[1]])[0] : "";
  });

/**
 * 打开某行的编辑弹框，返回下拉候选与当前值
 *
 * 行内按钮是 :show-text="false" 的纯图标态（只有 tooltip/aria-label），
 * 按序号定位更稳：0=详情 1=编辑 2=组卷 3=题库
 */
const openEditAndRead = async (rowIndex) => {
  const row = page.locator(".el-table__row").nth(rowIndex);
  await row.locator("button").nth(1).click();
  await page.locator('.el-dialog:visible').filter({ hasText: "编辑试卷" }).first()
    .waitFor({ timeout: 15000 });
  await sleep(1200);
  const d = page.locator('.el-dialog:visible').filter({ hasText: "编辑试卷" }).first();
  const gradeItem = d.locator(".el-form-item", { hasText: "年级" }).first();
  // Element Plus 把选中项渲染在 .el-select__placeholder 的 span 里，input.value 恒为空。
  // 读整个表单项的 innerText 会把 label「年级」也算进来，这里只取选中项那层。
  const shown = (await gradeItem.locator(".el-select__placeholder").first()
    .innerText().catch(() => "")) || "";
  await gradeItem.locator(".el-select").first().click();
  await sleep(900);
  const opts = await page.locator(".el-select-dropdown:visible .el-select-dropdown__item")
    .allInnerTexts();
  await page.keyboard.press("Escape");
  await sleep(500);
  // 显式点「取消」关掉编辑弹框，别靠 Escape（Escape 不可靠且会挡住下一步的点击）
  await d.locator(".el-dialog__footer button", { hasText: "取消" }).first().click();
  await sleep(1200);
  return { shown, opts: opts.map((s) => s.trim()).filter(Boolean) };
};

try {
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 }).catch(() => {});
  await sleep(900);
  await page.locator('input[type="text"]').first().fill("admin");
  await page.locator('input[type="password"]').first().fill("admin123");
  await page.locator('button:has-text("登录")').first().click();
  await page.waitForSelector("text=/欢迎回来/", { timeout: 30000 }).catch(() => {});
  await sleep(1500);

  console.log("=".repeat(68));
  console.log("  年级下拉修复验收");
  console.log("=".repeat(68));

  // 全新会话直接点编辑（不先开组卷弹框）—— 这是原来出 bug 的路径
  await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".el-table__row", { timeout: 30000 }).catch(() => {});
  await sleep(2500);

  const rowTexts = await page.locator(".el-table__row").allInnerTexts();
  console.log(`  当前列表 ${rowTexts.length} 行：`);
  rowTexts.forEach((t, i) =>
    console.log(`    [${i}] ` + t.replace(/\s+/g, " ").trim().slice(0, 88)));

  // 第0行是 AI 组的卷（库存 "3"），第1行是历史数据（库存 "三年级"），两种写法都要验
  for (const idx of [0, 1]) {
    const a = await openEditAndRead(idx);
    console.log(`   第${idx}行 回显="${a.shown}" 候选=${JSON.stringify(a.opts)}`);
    if (idx === 0) {
      chk("未先开组卷弹框时年级下拉也有选项", a.opts.length > 0, `${a.opts.length} 项`);
      chk("年级候选是中文名而非数字",
        a.opts.length > 0 && a.opts.every((o) => /年级$/.test(o)), JSON.stringify(a.opts));
    }
    chk(`第${idx}行年级回显为中文名（"3" 与 "三年级" 都归一）`,
      a.opts.includes(a.shown), `回显="${a.shown}"`);
  }

  // 组卷（新建）弹框的年级下拉有同样问题，一并验
  await page.locator("button").filter({ hasText: /^组卷$/ }).first().click();
  await page.locator(".el-dialog:visible").first().waitFor({ timeout: 15000 });
  await sleep(900);
  const cd = page.locator(".el-dialog:visible").first();
  await cd.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first().click();
  await sleep(800);
  await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "小学" }).first().click();
  await sleep(800);
  await cd.locator(".el-form-item", { hasText: "年级" }).locator(".el-select").first().click();
  await sleep(900);
  const createOpts = (await page.locator(".el-select-dropdown:visible .el-select-dropdown__item")
    .allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  console.log(`   组卷弹框年级候选 = ${JSON.stringify(createOpts)}`);
  chk("组卷弹框年级候选也是中文名", createOpts.length > 0 && createOpts.every((o) => /年级$/.test(o)),
    JSON.stringify(createOpts));
  // 显式点「取消」：Escape 关不掉这个弹框，残留遮罩会挡住下一步所有点击
  await cd.locator(".el-dialog__footer button", { hasText: "取消" }).first().click();
  await sleep(1500);
  chk("组卷弹框已关闭（无残留遮罩）",
    (await page.locator(".el-overlay:visible").count()) === 0,
    `遮罩数 ${await page.locator(".el-overlay:visible").count()}`);

  /* AI 组卷：验证学段归一化修复 */
  console.log("");
  console.log("  --- AI 组卷学段归一化 ---");
  await page.locator("button").filter({ hasText: /^组卷$/ }).first().click();
  await page.locator(".el-dialog:visible").first().waitFor({ timeout: 15000 });
  await sleep(900);
  const d2 = page.locator(".el-dialog:visible").first();
  const NAME = "学段归一" + String(Date.now()).slice(-5);
  await d2.locator('input[placeholder="请输入试卷名称"]').fill(NAME);
  await d2.locator('input[placeholder*="请输入学科"]').first().fill("数学");
  await d2.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first().click();
  await sleep(800);
  await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "初中" }).first().click();
  await sleep(800);
  await d2.locator(".el-form-item", { hasText: "年级" }).locator(".el-select").first().click();
  await sleep(800);
  await page.locator(".el-select-dropdown:visible .el-select-dropdown__item").first().click();
  await sleep(500);
  await d2.locator(".el-radio", { hasText: "AI 组卷" }).first().click();
  await sleep(900);
  const qn = d2.locator(".el-form-item", { hasText: "题目数量" }).locator("input").first();
  await qn.fill("3");
  await qn.press("Enter");
  await sleep(400);
  await d2.locator(".el-dialog__footer button").last().click();
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const m = (await page.locator("body").innerText()).match(/生成成功，试卷 ID:\s*(\d+)/);
    if (m) { pid = m[1]; break; }
  }
  chk("AI 组卷生成成功", !!pid, `paperId=${pid}`);
  if (pid) {
    const tok = await auth();
    const api = await page.evaluate(async ({ i, t }) => {
      const r = await fetch("/v2/edu/paper/" + i, { headers: { Authorization: "Bearer " + t } });
      const x = (await r.json()).data || {};
      return { level: x.paperGradeLevel, grade: x.paperGrade, subject: x.paperSubject };
    }, { i: pid, t: tok });
    console.log(`   AI 卷: 学科=${api.subject} 学段=${api.level} 年级=${api.grade}`);
    chk("AI 组卷学段存中文名（修复生效）", api.level === "初中", `level=${api.level}`);
    chk("不再存 PRIMARY/JUNIOR 码值", !/^[A-Z_]+$/.test(api.level || ""), `level=${api.level}`);

    // AI 生成的卷在列表里应能被学段筛选命中
    await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".el-table__row", { timeout: 30000 }).catch(() => {});
    await sleep(2500);
    const lvl = page.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first();
    await lvl.click();
    await sleep(800);
    await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "初中" }).first().click();
    await sleep(500);
    await page.locator('button:has-text("搜索")').first().click();
    await sleep(2200);
    const names = await page.locator(".el-table__row").allInnerTexts();
    const hit = names.some((t) => t.includes(NAME));
    chk("AI 卷能被「学段=初中」筛选命中", hit, `筛出 ${names.length} 行，命中=${hit}`);
  }
} catch (e) {
  chk("脚本未抛异常", false, e.message.slice(0, 200));
} finally {
  chk("无未捕获 JS 异常", errs.length === 0, errs.slice(0, 2).join(" || ") || "无");
  console.log("\n" + "=".repeat(68));
  const pass = R.filter((x) => x.ok).length;
  console.log(`  ${pass} / ${R.length} 通过`);
  R.filter((x) => !x.ok).forEach((x) => console.log("    FAIL: " + x.n));
  console.log("=".repeat(68));
  console.log("CLEANUP_PID=" + (pid || ""));
  await browser.close();
}
