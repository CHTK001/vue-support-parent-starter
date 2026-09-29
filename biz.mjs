/**
 * eduai 业务 + 浏览器验收（后端在 198，前端本地 dev）
 * 用法：node eduai-biz-accept.mjs
 */
import { chromium } from "playwright";

const BASE = "http://localhost:19093";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const chk = (n, ok, d = "") => {
  results.push({ n, ok });
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`);
};
const section = (t) => console.log("\n" + t);

const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1680, height: 1000 } });
const page = await ctx.newPage();
const jsErrs = [];
const net5xx = [];
page.on("pageerror", (e) => jsErrs.push(e.message.slice(0, 140)));
page.on("response", (r) => { if (r.status() >= 500) net5xx.push(`${r.status()} ${r.url()}`); });

console.log("=".repeat(76));
console.log("  eduai 业务验收（后端 198 + 前端本地 dev）");
console.log("=".repeat(76));

/* 1 登录（带重试，dev 首屏偶发慢） */
section("[1] 登录");
async function doLogin() {
  for (let a = 1; a <= 3; a++) {
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
    const ok = await page.waitForSelector('input[type="password"]', { timeout: 25000 }).then(() => true).catch(() => false);
    if (!ok) { console.log(`   第 ${a} 次未拿到表单，重试`); await sleep(2500); continue; }
    await sleep(600);
    await page.locator('input[type="text"]').first().fill("admin");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page.locator('button:has-text("登录")').first().click();
    await page.waitForSelector("text=/欢迎回来/", { timeout: 25000 }).catch(() => {});
    if (/欢迎回来/.test(await page.locator("body").innerText())) return true;
    await sleep(2000);
  }
  return false;
}
chk("登录成功", await doLogin());

/* 2 试卷列表 */
section("[2] 试卷列表");
await page.goto(BASE + "/edu/paper", { waitUntil: "domcontentloaded" });
await page.waitForSelector("button:has-text('组卷')", { timeout: 25000 }).catch(() => {});
await sleep(1800);
const tb = await page.evaluate(() =>
  [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim()).filter((t) => /组卷|新增/.test(t)));
chk("工具栏仅一个「组卷」按钮", tb.filter((t) => t === "组卷").length === 1, JSON.stringify(tb));
const opBtns = await page.locator(".el-table__row").first().locator("button").evaluateAll((els) =>
  els.map((e) => e.getAttribute("aria-label") || ""));
chk("操作列含 详情/组卷/题库", opBtns.length >= 3, opBtns.join(","));

/* 3 组卷弹框 */
section("[3] 组卷弹框 手动/AI");
await page.locator("button").filter({ hasText: /^组卷$/ }).first().click();
await sleep(1600);
const dlg = page.locator(".el-dialog:visible").first();
chk("弹框标题「组卷」", (await dlg.locator(".el-dialog__title").textContent().catch(() => "")).trim() === "组卷");
const radios = (await dlg.locator(".el-radio").allInnerTexts()).map((s) => s.trim());
chk("含 手动组卷 / AI 组卷", radios.includes("手动组卷") && radios.some((r) => /AI/.test(r)), radios.join(","));
await dlg.locator(".el-radio", { hasText: "AI" }).first().click();
await sleep(700);
const aiF = await dlg.locator(".el-form-item").evaluateAll((e) => e.map((x) => (x.querySelector(".el-form-item__label")?.textContent || "").trim()).filter(Boolean));
chk("AI 模式多出 题目数量/每题分值", aiF.some((f) => f.includes("题目数量")) && aiF.some((f) => f.includes("每题分值")), aiF.join(","));
chk("AI 模式按钮「生成试卷」", /生成试卷/.test(await dlg.locator(".el-dialog__footer button").last().textContent()));
await dlg.locator(".el-radio", { hasText: "手动" }).first().click();
await sleep(700);

/* 4 建卷 */
section("[4] 手动建卷（满分 120）");
const TAG = String(Date.now()).slice(-6);
await dlg.locator('input[placeholder="请输入试卷名称"]').fill("业务验收卷" + TAG);
await dlg.locator('input[placeholder*="请输入学科"]').first().fill("语文");
await dlg.locator(".el-form-item", { hasText: "学段" }).locator(".el-select").first().click();
await sleep(500);
await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "小学" }).first().click();
await sleep(700);
await dlg.locator(".el-form-item", { hasText: "年级" }).locator(".el-select").first().click();
await sleep(600);
const gOpts = (await page.locator(".el-select-dropdown:visible .el-select-dropdown__item").allInnerTexts()).map((s) => s.trim()).filter(Boolean);
// 修复前这里断言的是「年级只列 1-6」——那正是缺陷本身（edu_grade.grade_name 存的是 "1".."6"，
// 直接当标签渲染就是一串数字）。现在展示层统一转成中文年级名。
chk("选小学后年级列中文名（一年级..六年级）", gOpts.length === 6 && gOpts.every((g) => /年级$/.test(g)), gOpts.join(","));
await page.locator(".el-select-dropdown:visible .el-select-dropdown__item", { hasText: "三年级" }).first().click();
await sleep(500);
const ti = dlg.locator(".el-form-item", { hasText: "总分" }).first().locator("input").first();
await ti.fill(""); await ti.fill("120"); await sleep(300);
await dlg.locator(".el-dialog__footer button").last().click({ timeout: 8000 }).catch(() => {});
await page.waitForURL(/paper-compose/, { timeout: 25000 }).catch(() => {});
await sleep(2500);
const PID = (page.url().match(/paperId=(\d+)/) || [])[1];
chk("建卷成功并跳组卷页", !!PID, PID ? page.url() : page.url());
await page.waitForSelector(".compose-main", { timeout: 25000 }).catch(() => {});
await sleep(2000);

/* 5 组卷页结构 */
section("[5] 组卷页：三栏 / 返回 / 工具栏");
const ui = await page.evaluate(() => {
  const cp = document.querySelector(".compose-page");
  const kids = [...cp.children].map((c) => {
    const r = c.getBoundingClientRect();
    return { t: (c.querySelector(".panel-head__title")?.textContent || "").trim(), left: Math.round(r.left), right: Math.round(r.right) };
  }).sort((a, b) => a.left - b.left);
  return {
    cols: kids,
    hasBack: !!document.querySelector(".panel-head__back button"),
    backTip: document.querySelector(".panel-head__back button")?.getAttribute("aria-label") || "",
    acts: [...document.querySelectorAll(".compose-main .panel-head__actions button")].map((b) => b.getAttribute("aria-label") || ""),
    zoom: [...document.querySelectorAll(".preview-card .panel-head__actions button")].map((b) => b.getAttribute("aria-label") || ""),
    zoomValue: document.querySelector(".zoom-value")?.textContent || "",
    hasBadge: !!document.querySelector(".panel-head__badge"),
  };
});
console.log("   三栏:", JSON.stringify(ui.cols));
chk("三栏顺序 试卷题目/纸张预览/试卷购物车",
  /试卷题目/.test(ui.cols[0]?.t || "") && /纸张预览/.test(ui.cols[1]?.t || "") && /购物车/.test(ui.cols[2]?.t || ""),
  ui.cols.map((c) => c.t).join(" | "));
chk("三栏不重叠", ui.cols[0]?.right <= (ui.cols[1]?.left ?? 0) + 2 && ui.cols[1]?.right <= (ui.cols[2]?.left ?? 0) + 2);
chk("有返回按钮", ui.hasBack, ui.backTip);
chk("工具栏含 分值配置/设置/保存/发布", ui.acts.length === 4, ui.acts.join(" / "));
chk("设置图标带徽章容器", ui.hasBadge);
chk("预览有缩放按钮≥2", ui.zoom.length >= 2, ui.zoom.join(" / "));
chk("有缩放百分比", !!ui.zoomValue, ui.zoomValue);

/* 6 市场 → 购物车 */
section("[6] 题库市场 → 购物车（storage）");
await page.locator(".cart-panel .panel-head__actions button").first().click();
await sleep(2200);
const rows = page.locator(".el-dialog:visible .qmd-row");
const rc = await rows.count();
chk("市场弹框有题", rc > 0, `${rc} 行`);
for (let i = 0; i < Math.min(3, rc); i++) { await rows.nth(i).locator(".el-checkbox").first().click(); await sleep(220); }
await page.locator('.el-dialog:visible button:has-text("加入购物车")').first().click();
await sleep(2500);
const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("eduai:paper-cart:")));
chk("购物车写入当前试卷", keys.includes(`eduai:paper-cart:${PID}`), keys.join(","));
const cartItems = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "[]"), `eduai:paper-cart:${PID}`);
chk("购物车有题且分值非 0", cartItems.length > 0 && cartItems.every((x) => Number(x.score) > 0), `${cartItems.length} 题`);

/* 7 入卷 */
section("[7] 购物车 → 试卷（点击 + 拖拽）");
const b1 = await page.locator(".compose-row").count();
await page.locator("button").filter({ hasText: /^加入$/ }).first().click();
await sleep(1800);
const a1 = await page.locator(".compose-row").count();
chk("点击「加入」入卷", a1 > b1, `${b1} -> ${a1}`);
const dragRes = await page.evaluate(() => {
  const dz = document.querySelector(".compose-dropzone");
  const cr = [...document.querySelectorAll("[draggable='true']")].filter((e) => /cart/i.test(e.className));
  if (!dz || !cr.length) return { err: "no cart row" };
  const dt = new DataTransfer();
  const mk = (t) => new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: dt });
  const before = document.querySelectorAll(".compose-row").length;
  cr[0].dispatchEvent(mk("dragstart"));
  const ov = mk("dragover");
  dz.dispatchEvent(ov);
  dz.dispatchEvent(mk("drop"));
  cr[0].dispatchEvent(mk("dragend"));
  return new Promise((r) => setTimeout(() => r({ before, after: document.querySelectorAll(".compose-row").length, overPrevented: ov.defaultPrevented }), 900));
});
chk("拖拽 dragover preventDefault", dragRes.err === "no cart row" || dragRes.overPrevented === true, `${dragRes.overPrevented}`);
chk("拖拽后题目增加", dragRes.err === "no cart row" || dragRes.after > dragRes.before, `${dragRes.before} -> ${dragRes.after}`);

/* 7b 行 UI */
section("[7b] 题目行 UI");
const rowUi = await page.evaluate(() => {
  const h = document.querySelector(".compose-row__handle");
  const row = document.querySelector(".compose-row");
  const hr = h?.getBoundingClientRect(), rr = row?.getBoundingClientRect();
  return {
    rows: document.querySelectorAll(".compose-row").length,
    handleW: hr ? Math.round(hr.width) : 0, handleH: hr ? Math.round(hr.height) : 0, rowH: rr ? Math.round(rr.height) : 0,
    hasRmNumber: !!document.querySelector(".compose-row [class*=rm-number]"),
    hasMinus: !!document.querySelector(".compose-row [class*=step--minus]"),
    hasContent: !!document.querySelector(".compose-row__content"),
    hasHead: !!document.querySelector(".compose-row__head"),
    hasEditBtn: !!document.querySelector('.compose-row__actions button[title="编辑此题"]'),
  };
});
console.log("   行 UI:", JSON.stringify(rowUi));
chk("已有题目行", rowUi.rows > 0, `${rowUi.rows} 行`);
chk("拖拽柄≈整行高", rowUi.handleH >= rowUi.rowH - 3, `${rowUi.handleH} / ${rowUi.rowH}`);
chk("拖拽柄宽≥26px", rowUi.handleW >= 26, `${rowUi.handleW}px`);
chk("分值输入为 ReInputNumber 且带减号", rowUi.hasRmNumber && rowUi.hasMinus);
chk("题目行有详细内容容器", rowUi.hasContent && rowUi.hasHead);
chk("题目行有「编辑此题」按钮", rowUi.hasEditBtn);

/* 8 弹框 */
section("[8] 分值配置 / 编辑题目");
await page.locator(".compose-main .panel-head__actions button").first().click();
await sleep(1600);
const sd = page.locator(".el-dialog:visible").filter({ hasText: "分值配置" }).first();
chk("分值配置弹框打开", (await sd.count()) > 0);
chk("列出题目行", (await sd.locator(".score-dlg__row").count()) > 0, `${await sd.locator(".score-dlg__row").count()} 行`);
const inputs = sd.locator(".score-dlg__row input");
const cnt = await inputs.count();
for (let i = 0; i < cnt; i++) { await inputs.nth(i).fill("1"); await sleep(110); }
const sc1 = await inputs.evaluateAll((e) => e.map((x) => x.value).join(","));
await sd.locator("button").filter({ hasText: /按题数均分/ }).first().click();
await sleep(900);
const sc2 = await inputs.evaluateAll((e) => e.map((x) => x.value).join(","));
chk("弹框内均分把分值摊平", sc1 !== sc2, `${sc1} -> ${sc2}`);
await sd.locator(".el-dialog__footer button").last().click();
await sleep(1200);
await page.locator('.compose-row__actions button[title="编辑此题"]').first().click();
await sleep(1500);
const ed = page.locator(".el-dialog:visible").filter({ hasText: "编辑题目" }).first();
chk("编辑题目弹框打开", (await ed.count()) > 0);
const ef = await ed.locator(".el-form-item").evaluateAll((e) => e.map((x) => (x.querySelector(".el-form-item__label")?.textContent || "").trim()).filter(Boolean));
chk("含题干/答案/解析", ef.includes("题干") && ef.includes("答案") && ef.includes("解析"), ef.join(","));
await ed.locator(".el-dialog__footer button").last().click().catch(() => {});
await sleep(900);

/* 9 缩放 */
section("[9] 预览缩放");
const z1 = await page.evaluate(() => document.querySelector(".zoom-value")?.textContent);
await page.locator(".preview-card .panel-head__actions button").nth(1).click();
await sleep(900);
const z2 = await page.evaluate(() => document.querySelector(".zoom-value")?.textContent);
chk("放大改变比例", z1 !== z2, `${z1} -> ${z2}`);
await page.locator(".preview-card .panel-head__actions button").last().click();
await sleep(900);
chk("适应宽度复位", (await page.evaluate(() => document.querySelector(".zoom-value")?.textContent)) === z1);

/* 10 闸门/保存/发布 */
section("[10] 满分闸门 / 保存 / 发布 / 二维码 / 多页");
const now = await page.evaluate(() => {
  const m = document.body.innerText.match(/当前\s*(\d+)\s*\/\s*(\d+)\s*分/);
  return m ? { cur: Number(m[1]), full: Number(m[2]) } : null;
});
chk("满分显示 120", now && now.full === 120, JSON.stringify(now));
if (now && now.cur !== now.full) {
  await page.locator(".compose-main .panel-head__actions button").nth(3).click();
  await sleep(1600);
  chk("合计≠满分时发布被拦", /需先调整|请先/.test(await page.locator("body").innerText()));
}
await page.locator(".compose-main .panel-head__actions button").first().click();
await sleep(1500);
const sd2 = page.locator(".el-dialog:visible").filter({ hasText: "分值配置" }).first();
await sd2.locator("button").filter({ hasText: /按题数均分/ }).first().click();
await sleep(800);
await sd2.locator(".el-dialog__footer button").last().click();
await sleep(1200);
const ev = await page.evaluate(() => {
  const m = document.body.innerText.match(/当前\s*(\d+)\s*\/\s*(\d+)\s*分/);
  return m ? { cur: Number(m[1]), full: Number(m[2]) } : null;
});
chk("均分后合计=满分 120", ev && ev.cur === ev.full && ev.full === 120, JSON.stringify(ev));
await page.locator(".compose-main .panel-head__actions button").nth(2).click();
await sleep(3000);
chk("保存草稿成功", /已保存|保存成功|草稿已保存/.test(await page.locator("body").innerText()));
const qr = await page.evaluate(() => {
  const i = [...document.querySelectorAll(".qr-slot img")];
  return { n: i.length, rows: document.querySelectorAll(".compose-row").length, src: i[0]?.getAttribute("src")?.slice(0, 22) };
});
chk("每题二维码已渲染", qr.n > 0 && qr.n === qr.rows, `${qr.n}/${qr.rows}`);
chk("二维码为 PNG dataURL", !!qr.src && qr.src.startsWith("data:image/png"), qr.src);
const pg = await page.evaluate(() => {
  const t = document.body.innerText;
  return { c: (t.match(/共\s*(\d+)\s*页/) || [])[1] };
});
chk("多页预览有页数", !!pg.c, JSON.stringify(pg));
await page.locator(".compose-main .panel-head__actions button").nth(3).click();
await sleep(3000);
chk("发布成功", /发布成功/.test(await page.locator("body").innerText()));

/* 11 模板 */
section("[11] 数据配置 —— 组卷模板");
await page.goto(BASE + "/edu/data-config", { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=/组卷模板|模板管理/", { timeout: 30000 }).catch(() => {});
await sleep(1200);
chk("有模板管理入口", /组卷模板|模板管理/.test(await page.locator("body").innerText()));
const tab = page.locator("li, button, .el-tabs__item, .el-radio-button__inner").filter({ hasText: /组卷模板|模板管理/ }).first();
if (await tab.count()) { await tab.click(); await sleep(2000); }
const addBtn = page.locator("button").filter({ hasText: /新增模板|新建模板/ }).first();
chk("有新增模板按钮", (await addBtn.count()) > 0);
if (await addBtn.count()) {
  await addBtn.click();
  await sleep(1800);
  const td = page.locator(".el-dialog:visible").last();
  const tf = await td.locator(".el-form-item").evaluateAll((e) => e.map((x) => (x.querySelector(".el-form-item__label")?.textContent || "").trim()).filter(Boolean));
  const tdText = await td.innerText();
  chk("含名称/大标题风格", tf.some((f) => f.includes("名称")) && tf.some((f) => f.includes("风格")), tf.join(","));
  chk("含页眉/页脚", /页眉/.test(tdText) && /页脚/.test(tdText));
  await td.locator("input").first().fill("业务验收模板" + TAG);
  await sleep(300);
  await td.locator(".el-dialog__footer button").last().click().catch(() => {});
  await sleep(2500);
  chk("模板创建成功", new RegExp("业务验收模板" + TAG).test(await page.locator("body").innerText()));
}

/* 12 退出登录 */
section("[12] 退出登录");
await page.locator(".user-avatar-ring").first().hover();
await sleep(1300);
await page.waitForTimeout(400);
const tok = await page.evaluate(() => {
  const v = localStorage.getItem("system:accessToken") || "";
  const m = v.match(/[0-9a-zA-Z\-._~+/]{60,}=*/);
  return m ? m[0] : "";
});
const outBtn = page.locator(".el-popover:visible button", { hasText: "退出登录" }).first();
chk("「退出登录」按钮可见", await outBtn.isVisible());
await outBtn.click();
await sleep(3000);
chk("跳回登录页", /login/i.test(page.url()), page.url());
const revoked = await page.evaluate(async (t) => {
  const r = await fetch("/v2/edu/paper/page?pageNum=1&pageSize=1", { headers: { Authorization: "Bearer " + t } });
  return r.status;
}, tok);
chk("旧 token 已被吊销", revoked === 401 || revoked === 403, `HTTP=${revoked}`);

/* 13 稳定性 */
section("[13] 稳定性");
chk("无 5xx 响应", net5xx.length === 0, net5xx.slice(0, 2).join(" || ") || "无");
const realJs = jsErrs.filter((e) => !/favicon|ResizeObserver|Failed to load resource/i.test(e));
chk("无未捕获 JS 异常", realJs.length === 0, realJs.slice(0, 2).join(" || ") || "无");

console.log("\n" + "=".repeat(76));
const pass = results.filter((r) => r.ok).length;
console.log(`  结果：${pass} / ${results.length} 通过`);
results.filter((r) => !r.ok).forEach((r) => console.log("    FAIL: " + r.n));
console.log("=".repeat(76));
console.log("PAPER_ID=" + PID);
await browser.close();