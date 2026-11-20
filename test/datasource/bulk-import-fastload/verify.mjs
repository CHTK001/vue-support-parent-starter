/**
 * 批次 A · BulkImportDialog「快速导入能力门控」人眼级浏览器验收
 *
 * <p>验收对象：pages/datasource/src/components/sync/BulkImportDialog.vue
 * 批次 A 增强 —— 目标数据源下拉对 !fastLoadEnabled 项 :disabled 禁用 +
 * fastLoadHint 红/绿提示。真实链路：8848（vite dev，复用在跑实例）→ 194:8082 后端。</p>
 *
 * <p>流程：真实登录（admin/admin123 + 滑块）→ API 造两个临时 jdbc 数据源
 * （MySQL URL = fastLoadEnabled true；Oracle URL = null/不支持）→ 打开 /sync-tasks
 * 批量导入弹窗 → 断言下拉禁用态与提示 → 清理（按精确 id 删除全部「验收临时-快导」数据源）。
 * 全程不执行真实导入；清理放在 finally，任何断言失败都会先删临时数据再退出。</p>
 *
 * <p>用法（仓库根 vue-support-parent-starter）：</p>
 * <pre>node test/datasource/bulk-import-fastload/verify.mjs</pre>
 *
 * <p>产出：temp/monitor-batch-a/*.png 截图 + 控制台 ==== RESULT 断言清单。</p>
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.ACCEPT_BASE ?? "http://127.0.0.1:8848";
const OUT = path.resolve("D:/ch/project/temp/monitor-batch-a");
fs.mkdirSync(OUT, { recursive: true });
const PREFIX = "验收临时-快导";

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const results = [];
const assert = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
};

async function login(page) {
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  await page
    .waitForFunction(
      () => document.querySelector("input[name='username']") && document.querySelector("input[name='password']"),
      null,
      { timeout: 45000 },
    )
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const b = document.querySelector(".loading-box");
        return !b || getComputedStyle(b).display === "none";
      },
      null,
      { timeout: 40000 },
    )
    .catch(() => {});

  for (let s = 1; s <= 3; s++) {
    const track = page.locator(".slider-verify-track").first();
    if (!(await track.count())) break;
    const tb = await track.boundingBox().catch(() => null);
    if (!tb) break;
    const sy = tb.y + tb.height / 2;
    const sx = tb.x + 22;
    const ex = tb.x + tb.width + 30;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(sx + ((ex - sx) * i) / 12, sy, { steps: 1 });
      await page.waitForTimeout(40);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
    const passed = await page.evaluate(
      () => !!document.querySelector(".slider-verify--success, .slider-verify.is-success"),
    );
    log(`slider try${s} passed=${passed}`);
    if (passed) break;
  }

  await page.fill("input[name='username']", "admin");
  await page.fill("input[name='password']", "admin123");
  const respP = page
    .waitForResponse((r) => /user\/login/.test(r.url()) && r.request().method() === "POST", { timeout: 40000 })
    .catch(() => null);
  await page.locator(".login-btn").click({ timeout: 15000 }).catch(() => {});
  const resp = await respP;
  log(`login status=${resp ? resp.status() : "none"}`);
  await page.waitForFunction(() => !location.hash.includes("/login"), null, { timeout: 45000 }).catch(() => {});
}

/** 带登录态的数据源 API */
function dsApi(page) {
  return {
    list: async () =>
      page.evaluate(async () => {
        const tk = localStorage.getItem("token") || "";
        const res = await fetch("/ms/datasource/list", {
          headers: tk ? { Authorization: `Bearer ${tk}` } : {},
        });
        const j = await res.json();
        return (j.data || []).map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          fastLoadEnabled: d.fastLoadEnabled,
        }));
      }),
    create: async (body) =>
      page.evaluate(async (b) => {
        const tk = localStorage.getItem("token") || "";
        const res = await fetch("/ms/datasource", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, tk ? { Authorization: `Bearer ${tk}` } : {}),
          body: JSON.stringify(b),
        });
        const j = await res.json().catch(() => ({}));
        return { code: j.code, id: j.data && j.data.id, msg: j.msg };
      }, body),
    remove: async (id) =>
      page.evaluate(async (i) => {
        const tk = localStorage.getItem("token") || "";
        const res = await fetch(`/ms/datasource/${i}`, {
          method: "DELETE",
          headers: tk ? { Authorization: `Bearer ${tk}` } : {},
        });
        const j = await res.json().catch(() => ({}));
        return { code: j.code, success: j.success };
      }, id),
  };
}

/** 清理本验收创建的全部临时数据源（按名称前缀识别、按精确 id 删除） */
async function cleanup(api) {
  try {
    const rows = (await api.list()).filter((d) => d.name && d.name.includes(PREFIX));
    for (const r of rows) {
      const res = await api.remove(r.id);
      log(`cleanup id=${r.id} name=${r.name} → ${JSON.stringify(res)}`);
    }
    const left = (await api.list()).filter((d) => d.name && d.name.includes(PREFIX));
    return { removed: rows.map((r) => r.id), left: left.length };
  } catch (e) {
    log("cleanup error: " + String(e).slice(0, 120));
    return { removed: [], left: -1, error: String(e).slice(0, 120) };
  }
}

const browser = await chromium.launch({ headless: true, channel: "msedge" });
let api = null;
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  api = dsApi(page);

  await login(page);
  assert("登录成功", !/\/login/.test(page.url()), page.url());

  // ---- 造临时数据源（MySQL=支持快速导入 / Oracle=不支持）----
  await api.create({
    name: `${PREFIX}MySQL`,
    type: "jdbc",
    host: "127.0.0.1",
    port: 3306,
    database: "jdbc:mysql://127.0.0.1:3306/acceptance_tmp",
    username: "acceptance",
    password: "acceptance",
    remark: "批次A验收临时数据源，验证后删除",
    status: 1,
    driverClassName: "com.mysql.cj.jdbc.Driver",
  });
  await api.create({
    name: `${PREFIX}Oracle`,
    type: "jdbc",
    host: "127.0.0.1",
    port: 1521,
    database: "jdbc:oracle:thin:@127.0.0.1:1521:XE",
    username: "acceptance",
    password: "acceptance",
    remark: "批次A验收临时数据源，验证后删除",
    status: 1,
    driverClassName: "oracle.jdbc.OracleDriver",
  });
  const afterCreate = await api.list();
  const rowMy = afterCreate.find((d) => d.name === `${PREFIX}MySQL`);
  const rowOra = afterCreate.find((d) => d.name === `${PREFIX}Oracle`);
  assert("临时数据源已创建（MySQL/Oracle）", !!rowMy && !!rowOra, JSON.stringify(afterCreate));
  assert("后端方言计算：MySQL→true / Oracle→非 true",
    rowMy && rowMy.fastLoadEnabled === true && rowOra && rowOra.fastLoadEnabled !== true,
    `mysql=${rowMy && rowMy.fastLoadEnabled} oracle=${rowOra && rowOra.fastLoadEnabled}`);

  // ---- 打开数据同步页 + 批量导入弹窗 ----
  await page.goto(`${BASE}/#/sync-tasks`, { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
  await page
    .waitForFunction(() => document.body.innerText.includes("批量导入"), null, { timeout: 60000 })
    .catch(() => {});
  await page.locator("button", { hasText: "批量导入" }).first().click({ timeout: 20000 });
  await page
    .waitForFunction(() => document.body.innerText.includes("批量导入 CSV"), null, { timeout: 20000 })
    .catch(() => {});
  const dlgTxt = await page.evaluate(() => document.body.innerText);
  assert("批量导入弹窗打开（标题/步骤/表单）",
    dlgTxt.includes("批量导入 CSV") && dlgTxt.includes("选择文件") && dlgTxt.includes("目标数据源（jdbc）"));
  await page.screenshot({ path: path.join(OUT, "bulk-dialog-open.png") });

  // ---- 目标数据源下拉：禁用态断言 ----
  await page.locator(".bi-output .el-select").first().click({ timeout: 15000 });
  await page.waitForTimeout(1500);
  const opts = await page.evaluate(() => {
    const dds = Array.from(document.querySelectorAll(".el-select-dropdown")).filter(
      (d) => d.getBoundingClientRect().width > 0,
    );
    const dd = dds[dds.length - 1];
    if (!dd) return [];
    return Array.from(dd.querySelectorAll(".el-select-dropdown__item")).map((o) => ({
      text: o.innerText.trim(),
      disabled: o.classList.contains("is-disabled"),
    }));
  });
  const optMy = opts.find((o) => o.text.includes("快导MySQL"));
  const optOra = opts.find((o) => o.text.includes("快导Oracle"));
  assert("下拉含两个临时数据源", !!optMy && !!optOra, JSON.stringify(opts));
  assert("Oracle 选项被禁用（!fastLoadEnabled → :disabled）", optOra && optOra.disabled === true);
  assert("MySQL 选项可选（fastLoadEnabled=true 不禁用）", optMy && optMy.disabled === false);
  await page.screenshot({ path: path.join(OUT, "bulk-dropdown-disabled.png") });

  // ---- 选中 MySQL → 绿色提示 ----
  await page.locator(".el-select-dropdown__item", { hasText: "快导MySQL" }).first().click({ timeout: 10000 });
  await page.waitForTimeout(1200);
  const hint1 = await page.evaluate(() => {
    const h = document.querySelector(".bi-fastload-hint");
    return h ? { text: h.innerText.trim(), cls: h.className } : null;
  });
  assert("选中 MySQL 后出现绿色支持提示",
    !!hint1 && hint1.text.includes("该数据源支持快速导入") && /is-ok/.test(hint1.cls), JSON.stringify(hint1));

  // ---- 点击禁用的 Oracle 选项 → 选中值不变 ----
  await page.locator(".bi-output .el-select").first().click({ timeout: 10000 });
  await page.waitForTimeout(1000);
  const clickOra = await page
    .locator(".el-select-dropdown__item", { hasText: "快导Oracle" })
    .first()
    .click({ timeout: 5000, force: true })
    .then(() => "clicked")
    .catch((e) => "err:" + String(e).slice(0, 60));
  await page.waitForTimeout(1000);
  const sel = await page.evaluate(() => {
    const s = document.querySelector(".bi-output .el-select");
    const h = document.querySelector(".bi-fastload-hint");
    return { trigger: s ? s.innerText.trim() : "", hint: h ? h.innerText.trim() : "" };
  });
  assert("禁用项点击后选中值不变（仍为 MySQL）",
    sel.trigger.includes("快导MySQL") && sel.hint.includes("该数据源支持快速导入"),
    `click=${clickOra} trigger=${sel.trigger} hint=${sel.hint}`);
  await page.screenshot({ path: path.join(OUT, "bulk-hint-ok.png") });

  // ---- 错误路径：未选目标表时回车预览 → 前端校验提示（canPreview=false，按钮禁用兜底）----
  await page.locator(".bi-path-input input").first().fill("D:/tmp/acceptance-not-exist.csv");
  await page.locator(".bi-path-input input").first().press("Enter");
  await page.waitForTimeout(1500);
  const toasts = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".el-message")).map((m) => m.innerText.trim()),
  );
  assert("表单不完整时预览被拦截并提示", toasts.some((t) => t.includes("请填写文件路径")), JSON.stringify(toasts));
  const prevBtnDisabled = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.innerText.includes("预览 CSV"));
    return b ? b.disabled : null;
  });
  assert("预览按钮在不完整表单下保持禁用", prevBtnDisabled === true, `disabled=${prevBtnDisabled}`);
  await page.screenshot({ path: path.join(OUT, "bulk-preview-guard.png") });

  // ---- 关闭弹窗（不执行导入）----
  await page.locator(".st-dlg-actions button", { hasText: "取消" }).first().click({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);

  // ---- ScAgentList 孤儿路由佐证：/#/agents 不可达 ----
  await page.goto(`${BASE}/#/agents`, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(4000);
  const agentState = await page.evaluate(() => ({
    hash: location.hash,
    hasAgentTable: document.body.innerText.includes("Agent 总数"),
    body: document.body.innerText.slice(0, 150),
  }));
  assert("ScAgentList 无路由注册（/#/agents 不渲染 Agent 列表）",
    !agentState.hasAgentTable, `hash=${agentState.hash} body=${agentState.body.replace(/\n/g, "|")}`);
} finally {
  if (api) {
    const c = await cleanup(api);
    assert("临时数据源清理完成（按精确 id 删除、无残留）", c.left === 0, JSON.stringify(c));
  }
  await browser.close().catch(() => {});
}

const fails = results.filter((r) => !r.ok);
console.log("==== RESULT ====");
console.log(`total=${results.length} pass=${results.length - fails.length} fail=${fails.length}`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.name} | ${r.detail}`);
if (fails.length) process.exitCode = 1;
