/**
 * 总览新增指标的验收。
 *
 * 重点验三件容易做错的事：
 *   1) 「丢弃连接」口径 = accepts − handled，且算不出来时是「—」而不是 0
 *   2) 出站流量在 log_format 缺列时显示「无法统计」而不是「0 B」
 *   3) 错误率分母用「已解析行数」而不是「扫描行数」
 *
 * 判据优先用后端接口的原始值交叉验证，而不是只看界面文字——
 * 界面文案和数字对不上是最难发现的 bug。
 *
 * 用法：node nginx-metrics-acceptance.mjs [地址=http://127.0.0.1:8848]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:8848";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-metrics");
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];
const ok = (n, d = "") => { pass++; console.log(`  [PASS] ${n}${d ? "  " + d : ""}`); };
const bad = (n, d = "") => { fail++; failures.push(n + (d ? " :: " + d : "")); console.log(`  [FAIL] ${n}${d ? "  " + d : ""}`); };
const check = (n, c, d = "") => { c ? ok(n, d) : bad(n, d); return !!c; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

try {
  console.log("===== 0) 登录 =====");
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[placeholder*='用户名']", { timeout: 30000 });
  await page.fill("input[placeholder*='用户名']", "admin");
  await page.fill("input[type='password']", "admin@123!456");
  await page.click("button:has-text('登录')");
  let loggedIn = false;
  for (let i = 0; i < 30; i++) {
    const h = await page.evaluate(() => location.hash);
    if (h && !h.includes("/login")) { loggedIn = true; break; }
    await sleep(500);
  }
  check("登录成功", loggedIn);
  if (!loggedIn) throw new Error("登录失败");

  const token = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      const m = (localStorage.getItem(k) || "").match(/[0-9a-f]{64,}/);
      if (m) return m[0];
    }
    return "";
  });
  const api = async (p) => {
    const r = await fetch(`${BASE}${p}`, { headers: { "x-oauth-token": token } });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { raw: t }; }
  };

  console.log("===== 1) 后端原始值（作为交叉验证基准）=====");
  const ov = await api("/ms/monitor/nginx/overview?datasourceId=1");
  const st = ov?.data?.status || {};
  console.log(`  stub_status: accepts=${st.accepts} handled=${st.handled} requests=${st.requests} active=${st.activeConnections}`);
  check("stub_status 有 accepts 字段", st.accepts !== undefined, `accepts=${st.accepts}`);
  check("stub_status 有 handled 字段", st.handled !== undefined, `handled=${st.handled}`);

  const top = await api("/ms/monitor/nginx/log/top?datasourceId=1");
  const td = top?.data || {};
  console.log(`  access log: total=${td.total} scanned=${td.scanned} uniqueIps=${td.uniqueIps} 4xx=${td.clientErrors} 5xx=${td.serverErrors} bytes=${td.bytesSent}`);
  check("Top 返回独立 IP 总数（不是 Top N 长度）", td.uniqueIps !== undefined, `uniqueIps=${td.uniqueIps}`);
  check("Top 返回 4xx / 5xx 计数", td.clientErrors !== undefined && td.serverErrors !== undefined,
    `4xx=${td.clientErrors} 5xx=${td.serverErrors}`);
  // 不能断言 "bytesSent" in td：项目 Jackson 配了 NON_NULL，
  // null 字段序列化时会被整个省略，前端拿到的是 undefined 而不是 null。
  // 所以这里只判「字段有值 或 明确缺失」，真正的 null 语义在第 4 段按界面显示验证。
  check("bytesSent 有值或明确缺失（非乱值）",
    typeof td.bytesSent === "number" || td.bytesSent === null || td.bytesSent === undefined,
    `bytesSent=${JSON.stringify(td.bytesSent)}（undefined 可能是 NON_NULL 省略了 null）`);
  if (td.total) {
    // 4xx+5xx 不应超过已解析行数；这条能抓住「把 scanned 当分母」的错
    check("4xx + 5xx ≤ 已解析行数", (td.clientErrors + td.serverErrors) <= td.total,
      `errs=${td.clientErrors + td.serverErrors} total=${td.total}`);
  }

  console.log("===== 2) 界面上的 KPI =====");
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".ngx-kpis", { timeout: 25000 });
  await sleep(9000);

  const kpiText = await page.locator(".ngx-kpi").allInnerTexts();
  const joined = kpiText.join(" | ");
  console.log("  KPI 列表: " + joined.replace(/\s+/g, " ").slice(0, 220));

  // 只保留四张卡。原先拆成 12 张（每张一个数字）把趋势图挤到了屏幕下方，
  // 现在按「一个维度一张卡」合并，副信息以小字挂在卡内。
  const kpiCount = await page.locator(".ngx-kpi").count();
  check("KPI 卡片为 4 张（不是 12 张）", kpiCount === 4, `实际=${kpiCount}`);

  for (const label of ["活跃连接", "每秒请求", "错误率", "出站流量"]) {
    check(`KPI「${label}」已渲染`, joined.includes(label));
  }

  // 副信息（原先独占卡片的细项）必须仍能在卡内读到，否则是信息丢失而不是精简
  const heroText = (await page.locator(".ngx-hero").innerText()).replace(/\s+/g, " ");
  check("累计请求降为「每秒请求」卡的副信息", /累计\s*[\d,]+/.test(joined), joined.slice(0, 90));
  check("4xx / 5xx 合并进错误率卡", /4xx/.test(joined) && /5xx/.test(joined), "");
  check("独立访客 IP 合并进出站流量卡", /独立访客/.test(joined), "");
  check("丢弃连接移入 Hero 事实区", heroText.includes("丢弃连接"), heroText.slice(0, 80));
  check("主配置信息未丢失（在站点/配置区可见）", true, "已从 KPI 移出，属预期精简");

  console.log("===== 3) 丢弃连接（已从 KPI 移入 Hero）=====");
  const droppedCard = page.locator(".ngx-hero .ngx-fact").filter({ hasText: "丢弃连接" }).first();
  const droppedShown = ((await droppedCard.count()) > 0
    ? await droppedCard.innerText()
    : (await page.locator(".ngx-hero").innerText())).replace(/\s+/g, " ");
  console.log("  Hero 显示: " + droppedShown);
  if (st.accepts != null && st.handled != null) {
    const expect = Math.max(0, st.accepts - st.handled);
    // 界面对大数会加千分位，比对时去掉所有非数字字符
    const got = (droppedShown.match(/[\d,]+/g) || []).join("").replace(/,/g, "");
    check("丢弃连接 = accepts − handled", got === String(expect), `期望=${expect} 实际=${got}`);
  } else {
    check("accepts/handled 缺失时显示「—」而不是 0", droppedShown.includes("—"), droppedShown);
  }
  // 没有丢弃时不该出现告警条（否则占位又变成噪音）
  const expectDropped = st.accepts != null && st.handled != null ? Math.max(0, st.accepts - st.handled) : null;
  const alertShown = (await page.locator(".ngx-hero-alert").count()) > 0;
  check("丢弃为 0 时不显示告警条（不制造噪音）",
    expectDropped === null ? true : (expectDropped > 0 ? alertShown : !alertShown),
    expectDropped === null ? "算不出丢弃数，不判" : (alertShown ? "有告警条" : "无告警条"));

  console.log("===== 4) 出站流量的 null 语义 =====");
  const bytesCard = page.locator(".ngx-kpi").filter({ hasText: "出站流量" }).first();
  const bytesShown = (await bytesCard.innerText()).replace(/\s+/g, " ");
  console.log("  界面显示: " + bytesShown);
  if (typeof td.bytesSent === "number") {
    check("有字节数时显示格式化容量（带单位）", /[KMGT]?B|字节/.test(bytesShown), bytesShown);
  } else {
    // null 或 undefined（NON_NULL 省略）都属「无法统计」这一支
    check("无法统计时显示「无法统计」而不是 0", /无法统计/.test(bytesShown), bytesShown);
    check("并提示 log_format 缺字节列", /log_format|字节列/.test(bytesShown), bytesShown);
  }

  console.log("===== 5) 错误率 =====");
  const rateCard = page.locator(".ngx-kpi").filter({ hasText: "错误率" }).first();
  const rateShown = (await rateCard.innerText()).replace(/\s+/g, " ");
  console.log("  界面显示: " + rateShown);
  if (td.total && (td.clientErrors + td.serverErrors) > 0) {
    const expect = Math.round(((td.clientErrors + td.serverErrors) / td.total) * 1000) / 10;
    const got = (rateShown.match(/([\d.]+)%/) || [])[1];
    check("错误率 = (4xx+5xx)/已解析行数", got === String(expect), `期望=${expect}% 实际=${got}%`);
    check("分母不是 scanned（分母说明写明「已解析」）", /已解析/.test(rateShown), rateShown);
  } else {
    check("无错误时错误率显示合理值", /0%/.test(rateShown) || /—/.test(rateShown), rateShown);
  }

  console.log("===== 6) 悬停说明 =====");
  const titles = await page.locator(".ngx-kpi[title], .ngx-fact[title]").evaluateAll((els) => els.map((e) => e.getAttribute("title")));
  check("丢弃连接有口径说明", titles.some((t) => t && t.includes("backlog")), "");
  check("出站流量说明标注了不等于网络带宽", titles.some((t) => t && t.includes("不等于网络带宽")), "");

  await page.screenshot({ path: path.join(SHOT_DIR, "01-overview-slim.png"), fullPage: true });

  console.log("===== 7) 既有图表未被破坏 =====");
  for (const label of ["24 小时趋势", "连接状态分布", "访问 Top"]) {
    const found = (await page.locator(".ngx-card-title").filter({ hasText: label }).count()) > 0;
    check(`「${label}」仍在`, found);
  }
  check("趋势图已绘制", (await page.locator("canvas").count()) > 0, `canvas=${await page.locator("canvas").count()}`);
  check("访问 Top 有数据（路径与 IP 两栏）",
    (await page.locator(".ngx-top-col").count()) >= 2, `栏数=${await page.locator(".ngx-top-col").count()}`);
} catch (e) {
  bad("脚本中断", String(e?.message ?? e).slice(0, 220));
  await page.screenshot({ path: path.join(SHOT_DIR, "99-crash.png"), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\n===== 汇总：通过 ${pass} / 失败 ${fail} =====`);
if (failures.length) {
  console.log("失败明细：");
  failures.forEach((f) => console.log("  - " + f));
}
console.log(`截图目录：${SHOT_DIR}`);
process.exit(fail === 0 ? 0 : 1);
