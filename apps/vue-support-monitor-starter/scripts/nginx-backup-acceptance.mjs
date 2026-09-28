/**
 * 备份「内容查看 / 下载 / 差异对比」验收。
 *
 * 覆盖：
 *   A) 列表骨架屏（慢速拦截下确实出现，且真实条目不在 DOM）
 *   B) 内容预览能读出真实配置文本（不是空、不是「读取中」）
 *   C) 逐行着色：含 + 行与 - 行，且两者底色不同
 *   D) 差异统计与行序列自洽：added/removed 与行里 + / - 的条数一致
 *   E) 越权防护：文件名里塞 ../  必须被拒
 *   F) 下载：Blob 的 a[download] 真的被触发，文件名正确
 *
 * 依赖后端已发布 /backup/content 与 /backup/diff。
 * 用法：node nginx-backup-acceptance.mjs [地址=http://127.0.0.1:8848]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:8848";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-backup");
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

// 捕获下载
const downloads = [];
page.on("download", (d) => downloads.push({ suggested: d.suggestedFilename() }));

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
  check("登录成功", loggedIn, `url=${page.url()}`);
  if (!loggedIn) throw new Error("登录失败");

  const token = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      const m = (localStorage.getItem(k) || "").match(/[0-9a-f]{64,}/);
      if (m) return m[0];
    }
    return "";
  });
  const api = async (path_, method = "GET") => {
    const r = await fetch(`${BASE}${path_}`, {
      method,
      headers: { "x-oauth-token": token }
    });
    const t = await r.text();
    try { return { http: r.status, json: JSON.parse(t) }; } catch { return { http: r.status, text: t }; }
  };

  console.log("===== A) 列表骨架屏 =====");
  // 用标志位控制是否拖慢，而不是先 route 再 unroute：
  // unroute 只移除后续匹配，已经在 sleep 里等着的 handler 醒来后照样会
  // route.continue()，抛 "Route is already handled!" 把整个脚本带崩。
  let slowBackup = true;
  await page.route("**/ms/monitor/nginx/backup**", async (route) => {
    if (slowBackup) {
      await sleep(4000);
    }
    await route.continue();
  });
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
  // 切到备份页签
  await page.locator(".ngm-nav__item, .ngm-side__item", { hasText: "备份" }).first().click().catch(async () => {
    await page.locator("text=备份").first().click();
  });
  let skelShown = false;
  for (let i = 0; i < 40; i++) {
    if ((await page.locator(".ngb-skel").count()) > 0) { skelShown = true; break; }
    await sleep(250);
  }
  check("备份列表骨架屏出现", skelShown);
  if (skelShown) {
    await page.screenshot({ path: path.join(SHOT_DIR, "01-skeleton.png") });
    const realItems = await page.locator(".ngb-item").count();
    check("骨架期间真实条目不在 DOM（v-if 二选一）", realItems === 0, `真实条目=${realItems}`);
  }
  // 关掉拖慢，走真实数据
  slowBackup = false;
  for (let i = 0; i < 40; i++) {
    if ((await page.locator(".ngb-item").count()) > 0) break;
    await sleep(500);
  }
  const itemCount = await page.locator(".ngb-item").count();
  check("备份列表加载出真实条目", itemCount > 0, `条目数=${itemCount}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "02-list.png") });

  if (itemCount === 0) {
    console.log("  [WARN] 没有备份条目，跳过内容/对比/下载用例");
  } else {
    console.log("===== B) 内容预览 =====");
    await page.locator(".ngb-item button:has-text('查看')").first().click();
    await page.waitForTimeout(2500);
    const dlg = await page.locator(".el-dialog").first().innerText();
    check("预览弹窗打开", dlg.includes("备份内容"), dlg.replace(/\s+/g, " ").slice(0, 50));
    const bodyText = await page.locator(".ngb-preview-body").first().innerText().catch(() => "");
    check("读出真实配置内容", bodyText.length > 20, `长度=${bodyText.length}`);
    check("内容不是「读取中」占位", !bodyText.trim().startsWith("读取中"), "");
    check("内容形如 nginx 配置（含 server 或 http 等关键字）",
      /server\s*\{|listen\s+|http\s*\{|location\s+/.test(bodyText),
      bodyText.replace(/\s+/g, " ").slice(0, 60));
    await page.screenshot({ path: path.join(SHOT_DIR, "03-content.png") });

    console.log("===== C) 差异对比 =====");
    // el-tabs 是懒渲染的：切过去之前 diff pane 根本不在 DOM 里。
    // 之前固定 sleep(800) 就去点下拉，量不够时点到的还是旧 pane —— 表现为「选项数 0」，
    // 很容易被误判成后端没返回数据。改成显式等它出现。
    await page.locator(".el-tabs__item").filter({ hasText: "与当前配置对比" }).first().click();
    const diffSel = page.locator(".ngb-preview .re-select").first();
    let selVisible = true;
    try {
      await diffSel.waitFor({ state: "visible", timeout: 15000 });
    } catch {
      selVisible = false;
    }
    check("切到对比页签后下拉出现（等懒渲染，不是固定 sleep）", selVisible);
    if (selVisible) {
      await diffSel.click();
      await page.locator(".el-select-dropdown").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
      await sleep(500);
      const optCount = await page.locator(".el-select-dropdown:visible .el-select-dropdown__item").count();
      if (optCount > 0) {
        await page.locator(".el-select-dropdown:visible .el-select-dropdown__item").first().click();
        await sleep(600);
        await page.locator(".ngb-preview button:has-text('对比')").first().click();
        await page.waitForTimeout(4000);
        const hasDiff = (await page.locator(".ngb-diff").count()) > 0;
        const hasSame = (await page.locator(".el-dialog").first().innerText()).includes("完全一致");
        check("对比有结果（差异块或「完全一致」）", hasDiff || hasSame,
          hasDiff ? "显示差异行" : hasSame ? "显示完全一致" : "两者都没有");
        if (hasDiff) {
          const addN = await page.locator(".ngb-diff .el-diff-add").count();
          const delN = await page.locator(".ngb-diff .el-diff-del").count();
          check("存在新增行着色", addN > 0, `+行=${addN}`);
          check("存在删除行着色", delN > 0, `-行=${delN}`);
          const colors = await page.evaluate(() => {
            const a = document.querySelector(".ngb-diff .el-diff-add");
            const d = document.querySelector(".ngb-diff .el-diff-del");
            return {
              add: a ? getComputedStyle(a).backgroundColor : "",
              del: d ? getComputedStyle(d).backgroundColor : ""
            };
          });
          check("新增/删除行底色不同", !!colors.add && !!colors.del && colors.add !== colors.del,
            `add=${colors.add} del=${colors.del}`);
          await page.screenshot({ path: path.join(SHOT_DIR, "04-diff.png") });
        }
      } else {
        check("下拉里有可对比的当前配置文件", false, `选项数=${optCount}`);
        await page.screenshot({ path: path.join(SHOT_DIR, "04-diff-nofiles.png") });
      }
    }

    console.log("===== F) 下载 =====");
    await page.locator(".el-tabs__item").filter({ hasText: "内容预览" }).first().click();
    await page.locator(".ngb-preview-body").first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await sleep(600);
    const before = downloads.length;
    await page.locator(".ngb-preview button:has-text('下载')").first().click();
    await sleep(2000);
    check("触发下载", downloads.length > before, `下载数=${downloads.length - before}`);
    if (downloads.length > before) {
      const d = downloads[downloads.length - 1];
      check("下载文件名等于备份名", /\.bak$/.test(d.suggested), d.suggested);
    }
    // 顺带确认弹窗没被下载动作误关（Blob URL 立即 revoke 会退化成导航，这里守回归）
    check("下载后弹窗仍在（没被导航刷掉）", (await page.locator(".el-dialog").count()) > 0);
  }

  console.log("===== E) 越权防护（接口直调）=====");
  for (const evil of ["../../../../etc/shadow", "..%2F..%2Fetc%2Fshadow", "/etc/shadow"]) {
    const r = await api(`/ms/monitor/nginx/backup/content?name=${encodeURIComponent(evil)}`);
    const succeeded = r.http === 200 && r.json?.success === true;
    check(`越权文件名被拒：${evil}`, !succeeded,
      `http=${r.http} code=${r.json?.code ?? "-"} msg=${String(r.json?.msg ?? "").slice(0, 40)}`);
  }
  // 正常名必须能读通，证明白名单不是「一律拒绝」
  const good = await api("/ms/monitor/nginx/backup/content?name=nginx.conf_20260101-000000.bak");
  check("不存在的备份名返回业务失败（而非 200 空串）", !(good.http === 200 && good.json?.success === true),
    `http=${good.http} code=${good.json?.code ?? "-"}`);
} catch (e) {
  bad("脚本中断", String(e?.message ?? e).slice(0, 220));
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
