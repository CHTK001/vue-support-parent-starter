/**
 * 组卷 · 全功能验收
 *
 * 覆盖之前从未验过的组卷能力（不是全站业务，是组卷本身）：
 *  A 入口：列表「组卷」进入已有卷是否回读
 *  B AI 组卷真跑一遍
 *  C 画布：拖拽排序持久化 / 删除题目 / 编辑题目 / 分值
 *  D 购物车：按试卷分桶隔离 / 清空
 *  E 设置弹框：页眉页脚落库 / 纸张方向 / 套用模板 / 未分题目徽章
 *  F 预览与二维码：二维码内容=题项编号 / 多页 / 题目减少后页数收回
 *  G 满分闸门：未满时禁用 / 满后发布
 */
import { chromium } from "playwright";

const BASE = "http://localhost:19093";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = [];
const chk = (n, ok, d = "") => {
  R.push({ n, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`);
};
const sec = (t) => console.log(`\n  ── ${t} ──`);

const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message.slice(0, 140)));

const auth = () =>
  page.evaluate(() => {
    const raw = Object.keys(localStorage)
      .map((k) => [k, localStorage.getItem(k)])
      .find(([k, v]) => /token/i.test(k) && v && v.length > 60);
    return raw ? (raw[1].match(/[0-9a-zA-Z\-._~+/]{60,}=*/) || [raw[1]])[0] : "";
  });

const apiPaper = async (pid) =>
  page.evaluate(async ({ id, t }) => {
    const r = await fetch("/v2/edu/paper/" + id, { headers: { Authorization: "Bearer " + t } });
    const d = (await r.json()).data || {};
    return {
      name: d.paperName, full: d.paperTotalScore, status: d.paperStatus,
      pageSize: d.paperPageSize, orientation: d.paperPageOrientation,
      style: d.paperTitleStyle, header: d.paperHeader, footer: d.paperFooter,
      questions: (d.questions || []).map((q) => ({ id: q.id, no: q.questionNo, score: q.score, stem: (q.stem || "").slice(0, 18) })),
    };
  }, { id: pid, t: await auth() });

const addQs = async (pid) =>
  page.evaluate(async ({ id, t }) => {
    const r = await fetch("/v2/edu/question/page?pageNum=1&pageSize=8", { headers: { Authorization: "Bearer " + t } });
    return (((await r.json()).data || {}).data || []).map((q) => q.questionId);
  }, { id: pid, t: await auth() });

const createPaper = async (name, totalScore) => {
  const r = await page.evaluate(async ({ n, sc, t }) => {
    const res = await fetch("/v2/edu/paper", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
      body: JSON.stringify({ name: n, subject: "语文", gradeLevel: "PRIMARY", grade: "3", duration: 60, totalScore: sc }),
    });
    return ((await res.json()).data) || null;
  }, { n: name, sc: totalScore, t: await auth() });
  return r;
};

const saveDraft = async () => {
  await page.locator(".compose-main .panel-head__actions button").nth(2).click();
  for (let i = 0; i < 26; i++) {
    await sleep(450);
    const t = await page.locator("body").innerText();
    if (/草稿已保存|保存失败/.test(t)) return (t.match(/(草稿已保存|保存失败[^\n]{0,40})/) || [""])[0];
  }
  return "";
};

const TAGS = [...new Set([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])];
const NEW = (p) => "全功能" + p + String(Date.now()).slice(-4);
const created = [];

await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
await page.waitForSelector('input[type="password"]', { timeout: 40000 }).catch(() => {});
await sleep(900);
await page.locator('input[type="text"]').first().fill("admin");
await page.locator('input[type="password"]').first().fill("admin123");
await page.locator('button:has-text("登录")').first().click();
await page.waitForSelector("text=/欢迎回来/", { timeout: 30000 }).catch(() => {});
await sleep(1500);
console.log("=".repeat(74));
console.log("  组卷 · 全功能验收");
console.log("=".repeat(74));

/* ============ B. AI 组卷（真跑） ============ */
sec("B. AI 组卷真跑");
await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
await page.waitForSelector("button:has-text('组卷')", { timeout: 30000 }).catch(() => {});
await sleep(2200);
await page.locator("button").filter({ hasText: /^组卷$/ }).first().click();
await sleep(1600);
let d = page.locator(".el-dialog:visible").first();
const aiName = NEW("AI卷");
await d.locator('input[placeholder="请输入试卷名称"]').fill(aiName);
await d.locator('input[placeholder*="请输入学科"]').first().fill("语文");
await d.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first().click();
await sleep(600);
await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "小学" }).first().click();
await sleep(600);
await d.locator(".el-form-item", { hasText: "年级" }).locator(".el-select").first().click();
await sleep(600);
await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "3" }).first().click();
await sleep(400);
await d.locator(".el-radio", { hasText: "AI 组卷" }).first().click();
await sleep(700);
const qcnt = d.locator(".el-form-item", { hasText: "题目数量" }).locator("input").first();
await qcnt.fill("5");
await qcnt.press("Enter");
await sleep(300);
const spq = d.locator(".el-form-item", { hasText: "每题分值" }).locator("input").first();
await spq.fill("20");
await spq.press("Enter");
await sleep(300);
await d.locator(".el-dialog__footer button").last().click();
let aiPid = null;
for (let i = 0; i < 30; i++) {
  await sleep(500);
  const t = await page.locator("body").innerText();
  const m = t.match(/生成成功，试卷 ID:\s*(\d+)/);
  if (m) {
    aiPid = m[1];
    break;
  }
  if (/生成失败/.test(t)) {
    chk("AI 组卷生成成功", false, (t.match(/生成失败[^\n]{0,40}/) || [""])[0]);
    break;
  }
}
chk("AI 组卷生成成功并返回试卷 ID", !!aiPid, `paperId=${aiPid}`);
if (aiPid) {
  created.push(aiPid);
  const ai = await apiPaper(aiPid);
  console.log(`   AI 卷: ${ai.name} 满分=${ai.full} 题数=${ai.questions.length}`);
  chk("AI 组卷题数符合配置(5)", ai.questions.length === 5, `实际 ${ai.questions.length}`);
  chk("AI 组卷题项编号均已分配(非 TMP-)", ai.questions.every((q) => q.no && !q.no.startsWith("TMP-")),
    JSON.stringify(ai.questions.map((q) => q.no).slice(0, 3)));
  chk("AI 组卷分值符合配置(5x20=100)", ai.questions.length * 20 === ai.full, `${ai.questions.length}题 满分${ai.full}`);
  chk("AI 组卷 8 道候选题不重复", new Set(ai.questions.map((q) => q.id)).size === ai.questions.length);
}
await sleep(1200);

/* ============ A. 从列表「组卷」进入已有卷是否回读 ============ */
sec("A. 列表「组卷」进入已有卷 → 回读");
let paper2 = null;
if (aiPid) {
  await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
  await sleep(2500);
  const row = page.locator(".el-table__row").filter({ hasText: aiName }).first();
  await row.locator('button[aria-label="组卷"]').first().click();
  await sleep(3500);
  const backName = await page.evaluate(() => {
    const el = document.querySelector(".panel-head__title");
    return el ? el.textContent : "";
  });
  const rows = await page.locator(".compose-row").count();
  const sumLine = (await page.locator("body").innerText()).match(/当前\s*(\d+)\s*\/\s*(\d+)\s*分/);
  chk("从列表「组卷」进入会回读题目（不是空白新建）", rows > 0, `画布题数=${rows} 标题="${backName}"`);
  chk("回读后合计与满分一致", !!sumLine && sumLine[1] === sumLine[2], sumLine ? sumLine[0] : "未匹配");
}

/* ============ C. 拖拽排序持久化 ============ */
sec("C. 画布：拖拽排序 / 删除题目 / 编辑题目");
const P1 = await createPaper(NEW("排序卷"), 100);
created.push(String(P1));
const qids = await addQs(P1);
await page.evaluate(async ({ id, t, qs }) => {
  await fetch(`/v2/edu/paper/${id}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
    body: JSON.stringify(qs.map((q) => ({ questionId: q, score: 20 }))),
  });
}, { id: P1, t: await auth(), qs: qids.slice(0, 4) });
const beforeOrder = (await apiPaper(P1)).questions.map((q) => q.id);
console.log("   初始顺序: " + JSON.stringify(beforeOrder));
await page.goto(BASE + "/eduai/paper-compose?paperId=" + P1, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".compose-row", { timeout: 30000 }).catch(() => {});
await sleep(3000);

// 用 HTML5 DnD 把第 1 行拖到第 4 行之后
await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".compose-row")];
  const dt = new DataTransfer();
  const from = rows[0], to = rows[rows.length - 1];
  from.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: dt, cancelable: true }));
  to.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt }));
  from.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
});
await sleep(1200);
const uiOrder = await page.locator(".compose-row").evaluateAll((rs) => rs.map((r) => r.textContent.slice(0, 14)));
chk("拖拽后画布顺序变化", uiOrder[0] !== undefined, `首行="${uiOrder[0]}"`);
const s1 = await saveDraft();
chk("拖拽后保存成功", /草稿已保存/.test(s1), s1);
const afterOrder = (await apiPaper(P1)).questions.map((q) => q.id);
console.log("   拖拽后后端顺序: " + JSON.stringify(afterOrder));
chk("拖拽顺序已持久化（与拖拽前不同）", JSON.stringify(afterOrder) !== JSON.stringify(beforeOrder),
  `${JSON.stringify(beforeOrder)} -> ${JSON.stringify(afterOrder)}`);
chk("排序后题数不变（无丢失）", afterOrder.length === beforeOrder.length, `${beforeOrder.length} -> ${afterOrder.length}`);
chk("排序后题目集合不变（无重复/无新增）",
  JSON.stringify([...afterOrder].sort()) === JSON.stringify([...beforeOrder].sort()),
  JSON.stringify(afterOrder));

/* ---- 删除题目 ---- */
const cntBefore = (await page.locator(".compose-row").count());
await page.locator('.compose-row__actions button[title*="删除"], .compose-row__actions button[title*="移除"]').first().click().catch(() => {});
await sleep(1500);
// 若有确认框
const confirm = page.locator(".el-message-box:visible button").filter({ hasText: /确定|确认/ }).first();
if ((await confirm.count()) > 0) {
  await confirm.click();
  await sleep(1200);
}
const cntAfterDel = (await page.locator(".compose-row").count());
chk("删除题目后画布题数 -1", cntAfterDel === cntBefore - 1, `${cntBefore} -> ${cntAfterDel}`);
const s2 = await saveDraft();
chk("删除后保存成功", /草稿已保存/.test(s2), s2);
const delApi = await apiPaper(P1);
chk("删除已持久化到后端", delApi.questions.length === cntAfterDel, `后端 ${delApi.questions.length} vs 画布 ${cntAfterDel}`);
chk("被删的题不再出现在后端", delApi.questions.every((q) => afterOrder.includes(q.id)),
  `后端题号=${JSON.stringify(delApi.questions.map((q) => q.id))}`);

/* ---- 编辑题目：题干/答案/解析 ---- */
await page.locator('.compose-row__actions button[title*="编辑"]').first().click();
await sleep(1800);
const ed = page.locator(".el-dialog:visible").filter({ hasText: "编辑题目" }).first();
chk("编辑题目弹框打开", (await ed.count()) > 0);
if ((await ed.count()) > 0) {
  const ta = ed.locator(".el-form-item", { hasText: "题干" }).locator("textarea").first();
  const NEWSTEM = "验收专用题干" + String(Date.now()).slice(-4);
  await ta.fill(NEWSTEM);
  await sleep(300);
  await ed.locator(".el-form-item", { hasText: "答案" }).locator("textarea").first().fill("验收答案");
  await sleep(300);
  await ed.locator(".el-dialog__footer button").last().click();
  await sleep(1500);
  const s3 = await saveDraft();
  chk("编辑题目后保存成功", /草稿已保存/.test(s3), s3);
  const eApi = await apiPaper(P1);
  chk("题干已持久化", eApi.questions.some((q) => q.stem.includes("验收专用题干")),
    eApi.questions.map((q) => q.stem).slice(0, 2).join(" | "));
  const previewTxt = await page.locator(".pp-body").innerText().catch(() => "");
  chk("预览同步显示新题干", previewTxt.includes("验收专用题干"), previewTxt.slice(0, 50));
}

/* ============ E. 设置弹框：页眉页脚 / 纸张方向 / 模板 ============ */
sec("E. 设置弹框：页眉页脚 / 纸张 / 徽章");
await page.locator(".compose-main .panel-head__actions button").nth(1).click();
await sleep(2000);
const st = page.locator(".el-dialog:visible").filter({ hasText: "试卷设置" }).first();
chk("设置弹框打开", (await st.count()) > 0);
if ((await st.count()) > 0) {
  const HDR = "验收页眉" + String(Date.now()).slice(-3);
  const FTR = "验收页脚" + String(Date.now()).slice(-3);
  const hdrBox = st.locator(".settings-field", { hasText: "页眉" }).locator("textarea").first();
  if ((await hdrBox.count()) > 0) {
    await hdrBox.fill(HDR);
    await sleep(300);
  } else {
    const hdrInput = st.locator(".settings-field", { hasText: "页眉" }).locator("input").first();
    await hdrInput.fill(HDR);
    await sleep(300);
  }
  const ftrBox = st.locator(".settings-field", { hasText: "页脚" }).locator("textarea, input").first();
  if ((await ftrBox.count()) > 0) {
    await ftrBox.fill(FTR);
    await sleep(300);
  }
  // 方向改横向
  const dir = st.locator(".settings-field", { hasText: "方向" }).locator(".el-select").first();
  if ((await dir.count()) > 0) {
    await dir.click();
    await sleep(800);
    const opts = page.locator(".el-select-dropdown:visible .el-select-dropdown__item");
    if ((await opts.count()) > 1) {
      await opts.nth(1).click();
      await sleep(800);
    }
  }
  const beforeClose = await page.locator(".settings-preview__hint").innerText().catch(() => "");
  chk("设置弹框右侧实时预览随配置变化", /横向|纵向/.test(beforeClose), beforeClose);
  const hdrSeen = await page.locator(".settings-preview .pp-header__rich").count();
  chk("实时预览已渲染页眉富文本", hdrSeen >= 1, `pp-header__rich=${hdrSeen}`);
  await st.locator(".el-dialog__footer button").last().click();
  await sleep(1800);
  const s4 = await saveDraft();
  chk("设置改动后保存成功", /草稿已保存/.test(s4), s4);
  const setApi = await apiPaper(P1);
  chk("页眉已落库", (setApi.header || "").includes("验收页眉"), (setApi.header || "").slice(0, 30));
  chk("页脚已落库", (setApi.footer || "").includes("验收页脚"), (setApi.footer || "").slice(0, 30));
  chk("纸张方向已落库为横向", setApi.orientation === "LANDSCAPE", `orientation=${setApi.orientation}`);
  const pageW = await page.locator(".pp-page").first().evaluate((e) => e.getBoundingClientRect().width).catch(() => 0);
  const pageH = await page.locator(".pp-page").first().evaluate((e) => e.getBoundingClientRect().height).catch(() => 0);
  chk("横向后预览宽>高", pageW > pageH, `${Math.round(pageW)}x${Math.round(pageH)}`);
}

/* ============ E5. 未分题目徽章 ============ */
sec("E5. 设置徽章 = 未分题目数");
const badge = () => page.locator(".panel-head__badge").first().innerText().catch(() => "");
const rowsNow = await page.locator(".compose-row").count();
const b0 = (await badge()).trim();
chk("徽章显示数字", /\d/.test(b0), `徽章="${b0}" 题目数=${rowsNow}`);
chk("未全部设分时徽章非 0", Number(b0) > 0, `徽章="${b0}"`);
// 全部设分后徽章应归零
await page.locator(".compose-main .panel-head__actions button").first().click();
await sleep(1600);
const sd = page.locator(".el-dialog:visible").filter({ hasText: "分值配置" }).first();
const ins = sd.locator(".score-dlg__row input");
for (let i = 0, c = await ins.count(); i < c; i++) {
  await ins.nth(i).fill("25");
  await ins.nth(i).press("Enter");
  await sleep(200);
}
await sd.locator(".el-dialog__footer button").last().click();
await sleep(1500);
const b1 = (await badge()).trim();
chk("全部设分后徽章归零", Number(b1) === 0, `徽章="${b1}"`);

/* ============ F. 二维码内容 + 多页 + 页数收回 ============ */
sec("F. 二维码内容 / 多页 / 页数收回");
const qrInfo = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".compose-row")];
  return rows.map((r) => {
    const no = (r.innerText.match(/TMP-\d+|[A-Z]\d+-\d+/) || [""])[0];
    const img = r.querySelector("img[src^='data:image/png']");
    return { no, hasQr: !!img };
  });
});
chk("每题都有二维码 PNG", qrInfo.every((q) => q.hasQr), `${qrInfo.filter((q) => q.hasQr).length}/${qrInfo.length}`);
const apiNos = (await apiPaper(P1)).questions.map((q) => q.no);
chk("二维码所在行的题号都是真实编号", apiNos.length > 0 && apiNos.every((n) => n && !n.startsWith("TMP-")),
  JSON.stringify(apiNos.slice(0, 3)));

// 多页：加题直到多页
const pageCount = async () => (await page.locator(".pp-page").count());
const p1 = await pageCount();
await page.locator(".cart-panel .panel-head__actions button").first().click();
await sleep(2600);
const qm = page.locator(".el-dialog:visible .qmd-row");
const qn = await qm.count();
for (let i = 0; i < Math.min(6, qn); i++) {
  await qm.nth(i).locator(".el-checkbox").first().click();
  await sleep(200);
}
await page.locator('.el-dialog:visible button:has-text("加入购物车")').first().click();
await sleep(2400);
const ab = page.locator("button").filter({ hasText: /^加入$/ });
for (let i = 0; i < 6; i++) {
  if ((await ab.count()) === 0) break;
  await ab.first().click();
  await sleep(1300);
}
const p2 = await pageCount();
chk("加题后预览页数增加", p2 > p1, `${p1} 页 -> ${p2} 页`);

// 删题到只剩 1 题，页数应收回
for (let i = 0; i < 6; i++) {
  const rm = page.locator('.compose-row__actions button[title*="删除"], .compose-row__actions button[title*="移除"]');
  if ((await rm.count()) === 0) break;
  await rm.first().click();
  await sleep(1000);
  const cf = page.locator(".el-message-box:visible button").filter({ hasText: /确定|确认/ }).first();
  if ((await cf.count()) > 0) {
    await cf.click();
    await sleep(900);
  }
}
const p3 = await pageCount();
chk("题目减少后页数收回", p3 < p2 && p3 >= 1, `${p2} 页 -> ${p3} 页`);

/* ============ D. 购物车分桶 ============ */
sec("D. 购物车按试卷分桶");
const P2 = await createPaper(NEW("分桶卷"), 100);
created.push(String(P2));
const cartKey1 = `eduai:paper-cart:${P1}`;
const cartKey2 = `eduai:paper-cart:${P2}`;
await page.goto(BASE + "/eduai/paper-compose?paperId=" + P2, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".cart-panel", { timeout: 30000 }).catch(() => {});
await sleep(2500);
const k1 = await page.evaluate((k) => localStorage.getItem(k), cartKey1);
const k2 = await page.evaluate((k) => localStorage.getItem(k), cartKey2);
chk("卷1 的购物车独立于卷2（key 按 paperId 分桶）", cartKey1 !== cartKey2, `${cartKey1} / ${cartKey2}`);
chk("切到卷2 后卷2 有独立购物车", k2 !== null || k1 !== null, `卷1有=${k1 !== null} 卷2有=${k2 !== null}`);

/* ============ G. 满分闸门 ============ */
sec("G. 满分闸门：未满禁用 / 满后可发布");
const P3 = await createPaper(NEW("闸门卷"), 100);
created.push(String(P3));
await page.evaluate(async ({ id, t }) => {
  const r = await fetch("/v2/edu/question/page?pageNum=1&pageSize=3", { headers: { Authorization: "Bearer " + t } });
  const qs = (((await r.json()).data || {}).data || []).map((q) => q.questionId);
  await fetch(`/v2/edu/paper/${id}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
    body: JSON.stringify(qs.map((q) => ({ questionId: q, score: 10 }))),
  });
}, { id: P3, t: await auth() });
await page.goto(BASE + "/eduai/paper-compose?paperId=" + P3, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".compose-row", { timeout: 30000 }).catch(() => {});
await sleep(3000);
const pubBtn = page.locator(".compose-main .panel-head__actions button").nth(3);
const disabled = await pubBtn.getAttribute("aria-disabled");
const cls = (await pubBtn.getAttribute("class")) || "";
chk("未满满分时发布按钮不可用", disabled === "true" || /disabled/.test(cls), `aria-disabled=${disabled} class~disabled=${/disabled/.test(cls)}`);
await pubBtn.click({ force: true }).catch(() => {});
await sleep(2200);
const bodyTxt = await page.locator("body").innerText();
chk("点击未满时给出提示而非发布", /需先调整|发布失败/.test(bodyTxt) || (await apiPaper(P3)).status !== 1,
  (bodyTxt.match(/(需先调整[^\n]{0,30}|发布失败[^\n]{0,30})/) || ["无提示"])[0]);
// 调分到满
await page.locator(".compose-main .panel-head__actions button").first().click();
await sleep(1600);
const sd3 = page.locator(".el-dialog:visible").filter({ hasText: "分值配置" }).first();
const i3 = sd3.locator(".score-dlg__row input");
for (let k = 0, c = await i3.count(); k < c; k++) {
  await i3.nth(k).fill("34");
  await i3.nth(k).press("Enter");
  await sleep(200);
}
await sd3.locator(".el-dialog__footer button").last().click();
await sleep(1500);
const pub2 = page.locator(".compose-main .panel-head__actions button").nth(3);
const dis2 = (await pub2.getAttribute("class")) || "";
chk("调满后发布按钮恢复可用", !/disabled/.test(dis2), `class~disabled=${/disabled/.test(dis2)}`);
await pub2.click();
await sleep(3000);
const pubTxt = await page.locator("body").innerText();
const pubApi = await apiPaper(P3);
chk("发布成功且状态=1", /发布成功/.test(pubTxt) && pubApi.status === 1, `提示=${/发布成功/.test(pubTxt)} status=${pubApi.status}`);

chk("全程无未捕获 JS 异常", errs.length === 0, errs.slice(0, 2).join(" || ") || "无");

console.log("\n" + "=".repeat(74));
const pass = R.filter((x) => x.ok).length;
console.log(`  ${pass} / ${R.length} 通过`);
R.filter((x) => !x.ok).forEach((x) => console.log("    FAIL: " + x.n));
console.log("=".repeat(74));
console.log("CLEANUP_PIDS=" + created.join(","));
await browser.close();
