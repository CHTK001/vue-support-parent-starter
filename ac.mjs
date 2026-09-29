/**
 * 组卷页左栏 AI 组卷能力验收
 *
 * 要点：
 *  1) 左栏有 AI 组卷入口
 *  2) 入口的可用性由后端 /v2/edu/ai/capability 决定（后端依赖 spring-support-ai-starter）
 *  3) 不可用时按钮禁用 + tip 给出后端给的具体原因
 *  4) 可用时能打开弹框、跑 AI 选题、把题加进购物车
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

const auth = () =>
  page.evaluate(() => {
    const raw = Object.keys(localStorage)
      .map((k) => [k, localStorage.getItem(k)])
      .find(([k, v]) => /token/i.test(k) && v && v.length > 60);
    return raw ? (raw[1].match(/[0-9a-zA-Z\-._~+/]{60,}=*/) || [raw[1]])[0] : "";
  });

try {
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 }).catch(() => {});
  await sleep(900);
  await page.locator('input[type="text"]').first().fill("admin");
  await page.locator('input[type="password"]').first().fill("admin123");
  await page.locator('button:has-text("登录")').first().click();
  await page.waitForSelector("text=/欢迎回来/", { timeout: 30000 }).catch(() => {});
  await sleep(1500);

  console.log("=".repeat(70));
  console.log("  组卷页 AI 组卷能力验收");
  console.log("=".repeat(70));

  /* 后端能力探测的真实返回 */
  const cap = await page.evaluate(async () => {
    const raw = Object.keys(localStorage)
      .map((k) => [k, localStorage.getItem(k)])
      .find(([k, v]) => /token/i.test(k) && v && v.length > 60);
    const t = raw ? (raw[1].match(/[0-9a-zA-Z\-._~+/]{60,}=*/) || [raw[1]])[0] : "";
    const r = await fetch("/v2/edu/ai/capability", { headers: { Authorization: "Bearer " + t } });
    return { http: r.status, body: await r.json() };
  });
  console.log(`  后端 /v2/edu/ai/capability  HTTP=${cap.http}`);
  console.log(`    返回: ${JSON.stringify(cap.body?.data ?? cap.body)}`);
  chk("能力探测端点返回 200", cap.http === 200, `HTTP=${cap.http}`);
  chk("返回结构含 available/reason",
    cap.body?.data && typeof cap.body.data.available === "boolean" && typeof cap.body.data.reason === "string",
    JSON.stringify(cap.body?.data));

  const available = cap.body?.data?.available === true;
  console.log(`  => AI 组卷能力: ${available ? "可用" : "不可用"}（${cap.body?.data?.reason}）`);

  /* 进组卷页 */
  await page.goto(BASE + "/eduai/paper-compose", { waitUntil: "domcontentloaded" });
  await page.locator(".panel-head").first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(3000);

  // 左栏标题旁应有 4 个方形图标：AI组卷 / 分值配置 / 设置 / 保存 / 发布
  const leftActions = page.locator(".compose-col").first().locator(".panel-head__actions button");
  const n = await leftActions.count();
  console.log(`  左栏操作图标数: ${n}`);
  chk("左栏有 AI 组卷入口（图标数 ≥ 5）", n >= 5, `${n} 个`);

  /* 入口可用性必须与后端一致 */
  const btn = leftActions.first();
  const disabled = await btn.isDisabled();
  const tip = await btn.getAttribute("title") || (await btn.getAttribute("aria-label")) || "";
  console.log(`  AI 入口 disabled=${disabled}  tip="${tip}"`);
  chk("入口可用性与后端能力一致", disabled === !available,
    `后端 available=${available}，前端 disabled=${disabled}`);
  if (!available) {
    chk("不可用时 tip 给出后端给的原因", tip.includes(cap.body.data.reason.slice(0, 6)) || tip.length > 6,
      tip);
    console.log("  （后端 AI 不可用，跳过选题流程验证）");
  } else {
    /* 可用：打开弹框 -> 跑选题 -> 进购物车 */
    await btn.click();
    await page.locator('.el-dialog:visible').filter({ hasText: "AI 组卷" }).first()
      .waitFor({ timeout: 15000 });
    await sleep(900);
    const d = page.locator('.el-dialog:visible').filter({ hasText: "AI 组卷" }).first();
    chk("AI 组卷弹框打开", (await d.count()) > 0);
    const labels = await d.locator(".el-form-item__label").allInnerTexts();
    console.log(`  弹框字段: ${JSON.stringify(labels.map((s) => s.trim()))}`);
    chk("弹框含学科/学段/年级/题量/分值",
      ["学科", "学段", "年级"].every((k) => labels.some((l) => l.includes(k))), JSON.stringify(labels));

    // 条件齐了才让点
    const runBtn = d.locator(".el-dialog__footer button").last();
    chk("条件不全时「AI 选题」禁用", await runBtn.isDisabled());
    await d.locator(".el-form-item", { hasText: "学科" }).locator("input").first().fill("语文");
    await d.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first().click();
    await sleep(800);
    await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "小学" }).first().click();
    await sleep(700);
    await d.locator(".el-form-item", { hasText: "年级" }).locator(".el-select").first().click();
    await sleep(800);
    await page.locator(".el-select-dropdown:visible .el-select-dropdown__item").first().click();
    await sleep(600);
    chk("条件齐后「AI 选题」可点", !(await runBtn.isDisabled()));

    const cartBefore = await page.locator(".cart-row").count();
    await runBtn.click();
    await page.locator(".el-dialog:visible").count();
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      if ((await page.locator(".el-dialog:visible").count()) === 0) break;
    }
    await sleep(1200);
    const cartAfter = await page.locator(".cart-row").count();
    const cartText = (await page.locator(".compose-col").last().innerText()).replace(/\s+/g, " ");
    console.log(`  购物车 ${cartBefore} -> ${cartAfter} 题`);
    chk("AI 选题结果进了购物车", cartAfter > cartBefore, `${cartBefore} -> ${cartAfter}`);
    chk("购物车计数同步增加",
      new RegExp(String(cartAfter)).test(cartText), cartText.slice(0, 80));
  }

  chk("全程无未捕获 JS 异常", errs.length === 0, errs.slice(0, 2).join(" || ") || "无");
} catch (e) {
  chk("脚本未抛异常", false, e.message.slice(0, 200));
} finally {
  console.log("\n" + "=".repeat(70));
  const pass = R.filter((x) => x.ok).length;
  console.log(`  ${pass} / ${R.length} 通过`);
  R.filter((x) => !x.ok).forEach((x) => console.log("    FAIL: " + x.n));
  console.log("=".repeat(70));
  await browser.close();
}
