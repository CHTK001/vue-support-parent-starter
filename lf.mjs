/**
 * 试卷列表学段筛选回归
 *
 * 背景：列里存中文名（小学/初中），列表下拉提交的是码值（PRIMARY/JUNIOR），
 * mapper 原值等值比较 → 选了学段查不到任何卷。读端已加 GradeLevels.normalize。
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
const page = await (await browser.newContext({ viewport: { width: 1680, height: 1000 } })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 150)));

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
  console.log("  试卷列表学段筛选回归");
  console.log("=".repeat(68));

  await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".el-table__row", { timeout: 30000 }).catch(() => {});
  await sleep(2500);

  const all = await page.locator(".el-table__row").count();
  const levels = new Set(
    (await page.locator(".el-table__row").allInnerTexts())
      .map((t) => (t.split(/\s+/).find((c) => /^(小学|初中|高中|大学)$/.test(c)) || "?")),
  );
  console.log(`  不筛选：${all} 行，学段分布=${JSON.stringify([...levels])}`);
  chk("不筛选能列出全部卷", all > 0, `${all} 行`);

  // 逐个学段筛，验证「选了有数据 / 选了没数据能区分」
  // 检索区是 ReSearch（koi-search__field + koi-search__field-label），不是 el-form-item
  const lvlField = () => page.locator(".koi-search__field")
    .filter({ has: page.locator(".koi-search__field-label", { hasText: /^学段$/ }) }).first();

  for (const [name, expectSome] of [["小学", true], ["初中", true], ["高中", false], ["大学", false]]) {
    await lvlField().locator(".el-select").first().click();
    await sleep(800);
    await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: name }).first().click();
    await sleep(500);
    await page.locator('button:has-text("搜索")').first().click();
    await sleep(2200);
    const n = await page.locator(".el-table__row").count();
    const empty = await page.locator("text=/暂无数据/").count();
    const shown = n > 0 ? n : (empty > 0 ? 0 : n);
    console.log(`   筛 ${name} -> ${shown} 行（空态提示 ${empty}）`);
    chk(`筛「${name}」结果与数据一致`, expectSome ? shown > 0 : shown === 0, `${shown} 行`);

    // 清掉再进下一轮
    await page.locator('button:has-text("重置")').first().click().catch(() => {});
    await sleep(2000);
  }

  // 打印态的筛选抬头应跟着变（打印功能联动）
  await lvlField().locator(".el-select").first().click();
  await sleep(800);
  await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "小学" }).first().click();
  await sleep(500);
  await page.locator('button:has-text("搜索")').first().click();
  await sleep(2200);
  await page.locator("button", { hasText: /^打印$/ }).first().click();
  await page.locator(".print-sheet").first().waitFor({ state: "attached", timeout: 20000 }).catch(() => {});
  await sleep(900);
  const pf = await page.evaluate(() => {
    const el = document.querySelector(".print-sheet");
    return {
      filter: el?.querySelector(".print-sheet__filter")?.textContent?.trim(),
      rows: el?.querySelectorAll("tbody tr").length,
      levels: [...(el?.querySelectorAll("tbody tr") || [])].map((r) => r.children[3]?.textContent?.trim()),
    };
  });
  console.log(`  打印抬头: "${pf.filter}" 行数=${pf.rows} 各行学段=${JSON.stringify(pf.levels)}`);
  chk("打印抬头显示学段筛选", !!pf.filter && pf.filter.includes("学段"), pf.filter);
  chk("打印出的每一行学段都等于所选学段",
    pf.rows > 0 && pf.levels.every((l) => l === "小学"), JSON.stringify(pf.levels));
} catch (e) {
  chk("脚本未抛异常", false, e.message.slice(0, 200));
} finally {
  chk("无未捕获 JS 异常", errs.length === 0, errs.slice(0, 2).join(" || ") || "无");
  console.log("\n" + "=".repeat(68));
  const pass = R.filter((x) => x.ok).length;
  console.log(`  ${pass} / ${R.length} 通过`);
  R.filter((x) => !x.ok).forEach((x) => console.log("    FAIL: " + x.n));
  console.log("=".repeat(68));
  await browser.close();
}
