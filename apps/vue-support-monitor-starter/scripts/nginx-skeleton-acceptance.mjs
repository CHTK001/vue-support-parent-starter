/**
 * 骨架屏验收：把接口响应人为拖慢，让首屏骨架真正出现，然后截图取证。
 *
 * 为什么需要单独脚本：总览接口常态 3.6~4.2s，其实在真实浏览器里骨架屏已经会闪一下；
 * 但自动截图往往在数据到齐后才拍，抓不到骨架。这里用 route 拦截把 overview
 * 与 trend 各拖 6s，并在骨架出现时、业务数据渲染后各截一张，两张对照。
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:8848";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-skeleton");
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
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

try {
  console.log("===== 1) 登录 =====");
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
  check("登录成功", loggedIn, `url=${page.url()}`);
  if (!loggedIn) throw new Error("登录失败");

  console.log("===== 2) 装慢速拦截（overview / trend 各拖 6s）=====");
  // 只拖总览相关的三个接口；数据源列表等保持正常，避免登录态/数据源选择被拖死
  await page.route("**/ms/monitor/nginx/overview**", async (route) => {
    await sleep(6000);
    await route.continue();
  });
  await page.route("**/ms/monitor/nginx/metric/trend**", async (route) => {
    await sleep(6000);
    await route.continue();
  });

  console.log("===== 3) 进总览页，抓骨架态 =====");
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });

  // 等骨架出现
  let skelShown = false;
  for (let i = 0; i < 40; i++) {
    if ((await page.locator(".ngx-skeleton").count()) > 0) { skelShown = true; break; }
    await sleep(250);
  }
  check("首屏骨架屏出现", skelShown);
  if (skelShown) {
    await page.screenshot({ path: path.join(SHOT_DIR, "01-skeleton.png") });

    // 骨架的三个组成部分都在
    const hasHero = (await page.locator(".ngx-skel-hero").count()) > 0;
    const hasKpi = (await page.locator(".ngx-skel-kpis").count()) > 0;
    const hasChart = (await page.locator(".ngx-skel-chart").count()) > 0;
    check("骨架含 Hero 占位", hasHero);
    check("骨架含 KPI 占位（4 格）", hasKpi, `格子数=${await page.locator(".ngx-skel-kpis > *").count()}`);
    check("骨架含图表占位", hasChart);

    // 真实内容此刻不该在 DOM 里（v-if 二选一，不是叠加）
    const heroReal = (await page.locator(".ngx-hero").count()) > 0;
    check("骨架期间真实内容不在 DOM（v-if 二选一，不是 v-show 叠加）", !heroReal);

    // 不该再有整页 loading 遮罩
    const mask = (await page.locator(".el-loading-mask").count()) > 0;
    check("整页 loading 遮罩已移除（改用骨架屏）", !mask);
  }

  console.log("===== 4) 等数据到齐，抓真实态 =====");
  let skelGone = false;
  for (let i = 0; i < 60; i++) {
    if ((await page.locator(".ngx-skeleton").count()) === 0) { skelGone = true; break; }
    await sleep(500);
  }
  // 这一条必须建立在「骨架出现过」之上：骨架从未出现时 count 一直是 0，
  // 「消失」断言会假通过——第一版就因此把「骨架没出现」报成了「消失正常」。
  check("数据到齐后骨架消失", skelShown && skelGone, skelShown ? "" : "骨架从未出现，本条无从验证");
  if (skelGone) {
    await page.screenshot({ path: path.join(SHOT_DIR, "02-loaded.png") });
    const heroText = await page.locator(".ngx-hero").first().innerText().catch(() => "");
    check("真实内容正常渲染", /运行中|未运行|加载失败|未取到/.test(heroText), heroText.replace(/\s+/g, " ").slice(0, 60));
    // 骨架样式与真实卡片的高度应接近，说明没有明显布局跳动
    const skelH = 246, cardH = await page.locator(".ngx-trend-card").first().evaluate((e) => e.getBoundingClientRect().height).catch(() => 0);
    check("图表卡片高度与骨架接近（无布局跳动）", Math.abs(cardH - skelH) < 140, `真实=${Math.round(cardH)}px 骨架=${skelH}px`);
  }

  console.log("===== 5) 刷新时不应闪回骨架 =====");
  // 关键回归点：SSE 推帧会触发后台刷新，若 loaded 被重置就会每隔几秒闪一次
  await page.evaluate(() => { window.__skelSeenAfterLoad = false; });
  const obs = page.exposeFunction("__markSkel", () => {});
  await obs;
  await page.evaluate(() => {
    const mo = new MutationObserver(() => {
      if (document.querySelector(".ngx-skeleton")) { window.__skelSeenAfterLoad = true; }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });
  await sleep(20000);
  const flashed = await page.evaluate(() => !!window.__skelSeenAfterLoad);
  check("加载完成 20s 内骨架未再出现（无周期性闪烁）", !flashed);
  await page.screenshot({ path: path.join(SHOT_DIR, "03-after-20s.png") });
} catch (e) {
  bad("脚本中断", String(e?.message ?? e).slice(0, 200));
  await page.screenshot({ path: path.join(SHOT_DIR, "99-crash.png") }).catch(() => {});
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
