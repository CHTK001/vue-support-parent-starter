/**
 * 组卷 · AI 组卷专项（上次全功能套件在这里被外部打断，单独确认它可靠）
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

const apiPaper = async (id) =>
  page.evaluate(async ({ i, t }) => {
    const r = await fetch("/v2/edu/paper/" + i, { headers: { Authorization: "Bearer " + t } });
    const d = (await r.json()).data || {};
    return {
      name: d.paperName, full: d.paperTotalScore, status: d.paperStatus,
      subject: d.paperSubject, level: d.paperGradeLevel, grade: d.paperGrade,
      difficulty: d.paperDifficulty, duration: d.paperDuration,
      questions: (d.questions || []).map((q) => ({ id: q.id, no: q.questionNo, score: q.score })),
    };
  }, { i: id, t: await auth() });

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
  console.log("  AI 组卷专项");
  console.log("=".repeat(68));

  await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("button:has-text('组卷')", { timeout: 30000 }).catch(() => {});
  await sleep(2500);
  await page.locator("button").filter({ hasText: /^组卷$/ }).first().click();
  await page.locator(".el-dialog:visible").first().waitFor({ timeout: 15000 });
  await sleep(800);

  const d = page.locator(".el-dialog:visible").first();
  const NAME = "AI组卷验收" + String(Date.now()).slice(-5);
  await d.locator('input[placeholder="请输入试卷名称"]').fill(NAME);
  await d.locator('input[placeholder*="请输入学科"]').first().fill("语文");
  await d.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first().click();
  await sleep(700);
  await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "小学" }).first().click();
  await sleep(700);
  await d.locator(".el-form-item", { hasText: "年级" }).locator(".el-select").first().click();
  await sleep(700);
  await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "3" }).first().click();
  await sleep(500);
  chk("手动/AI 切换前是默认手动", await d.locator(".el-form-item", { hasText: "题目数量" }).count() === 0);

  await d.locator(".el-radio", { hasText: "AI 组卷" }).first().click();
  await sleep(900);
  chk("切到 AI 组卷后多出题量/分值", (await d.locator(".el-form-item", { hasText: "题目数量" }).count()) > 0);
  chk("AI 模式按钮变为「生成试卷」", (await d.locator('.el-dialog__footer button:has-text("生成试卷")').count()) > 0);

  const qn = d.locator(".el-form-item", { hasText: "题目数量" }).locator("input").first();
  await qn.fill("6");
  await qn.press("Enter");
  const sp = d.locator(".el-form-item", { hasText: "每题分值" }).locator("input").first();
  await sp.fill("15");
  await sp.press("Enter");
  await sleep(500);
  console.log(`   目标: 6 题 x 15 分 = 90 分`);

  await d.locator(".el-dialog__footer button").last().click();
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const t = await page.locator("body").innerText();
    const m = t.match(/生成成功，试卷 ID:\s*(\d+)/);
    if (m) {
      pid = m[1];
      break;
    }
    if (/生成失败|失败/.test(t)) {
      chk("AI 组卷生成成功", false, (t.match(/生成失败[^\n]{0,50}/) || [""])[0]);
      break;
    }
  }
  chk("AI 组卷生成成功并返回试卷 ID", !!pid, `paperId=${pid}`);

  if (pid) {
    const ai = await apiPaper(pid);
    console.log(`   结果: ${ai.name} | 学科=${ai.subject} 学段=${ai.level} 年级=${ai.grade} 时长=${ai.duration} 难度=${ai.difficulty}`);
    console.log(`   题数=${ai.questions.length} 满分=${ai.full} 编号=${JSON.stringify(ai.questions.map((q) => q.no).slice(0, 3))}`);
    chk("学科/学段/年级按表单落库", ai.subject === "语文" && /小学/.test(ai.level || ""), `${ai.subject}/${ai.level}/${ai.grade}`);
    chk("题数符合配置(6)", ai.questions.length === 6, `实际 ${ai.questions.length}`);
    chk("满分=题数x每题分值(6x15=90)", ai.full === 90 && ai.questions.every((q) => q.score === 15), `满分=${ai.full} 各题=${[...new Set(ai.questions.map((q) => q.score))]}`);
    chk("题目不重复", new Set(ai.questions.map((q) => q.id)).size === ai.questions.length);
    chk("题项编号均真实（非 TMP-）", ai.questions.every((q) => q.no && !q.no.startsWith("TMP-")), JSON.stringify(ai.questions.map((q) => q.no).slice(0, 2)));
    chk("AI 卷状态为已发布", ai.status === 1, `status=${ai.status}`);

    // 进组卷页看是否可继续编辑
    await page.goto(BASE + "/eduai/paper-compose?paperId=" + pid, { waitUntil: "domcontentloaded" });
    await page.locator(".compose-row").first().waitFor({ timeout: 25000 }).catch(() => {});
    await sleep(2500);
    const rows = await page.locator(".compose-row").count();
    chk("AI 卷可进组卷页继续编辑", rows === 6, `画布题数=${rows}`);
    const sumLine = (await page.locator("body").innerText()).match(/当前\s*(\d+)\s*\/\s*(\d+)\s*分/);
    chk("合计与满分一致（可继续组卷）", !!sumLine && sumLine[1] === sumLine[2], sumLine ? sumLine[0] : "未匹配");
  }
} catch (e) {
  chk("脚本未抛异常", false, e.message.slice(0, 160));
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
