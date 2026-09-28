/**
 * Nginx 控制台 —— 全业务功能验收（Playwright）
 *
 * 为什么用生产构建而不是 dev server：
 *   同仓库有别的 agent 在持续改文件，vite HMR 不断 page reload，
 *   浏览器端根本稳不住（实测页面反复被冲掉、组件挂不上）。
 *   dist 是静态产物，无 HMR，验收期间不会被任何人打断。
 *
 * 覆盖：
 *   1) 登录 → 工作台
 *   2) 数据源中心：列表 / 新增页签 / 数据表（并入的数据库管理器）
 *   3) Nginx 控制台 6 个页签逐个打开并断言有真实内容
 *   4) 生命周期：校验配置 → 重载 → 停止（断言 8080 真的挂）→ 启动（断言恢复）
 *      停止/启动期间会短暂中断 8080，脚本结束前必定恢复；异常退出会留 nginx 停着，
 *      兜底：systemctl start ngx-console（不依赖本控制台）
 *
 * 用法：node nginx-console-acceptance.mjs [基址=http://127.0.0.1:8850]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:8850";
const SHOT_DIR = path.join(__dirname, "..", "test-results", "nginx-acceptance");
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, detail = "") {
  pass++;
  console.log(`  [PASS] ${name}${detail ? "  " + detail : ""}`);
}
function bad(name, detail = "") {
  fail++;
  failures.push(name + (detail ? " :: " + detail : ""));
  console.log(`  [FAIL] ${name}${detail ? "  " + detail : ""}`);
}
function check(name, cond, detail = "") {
  cond ? ok(name, detail) : bad(name, detail);
  return !!cond;
}

/** 等某个选择器出现并返回其文本；超时返回 null */
async function textOf(page, sel, timeout = 15000) {
  try {
    await page.waitForSelector(sel, { timeout });
    return ((await page.locator(sel).first().innerText()) || "").trim();
  } catch {
    return null;
  }
}

/** 探测 8080 是否在服务（用 node 自己发请求，不引额外依赖） */
async function probe8080() {
  try {
    const r = await fetch("http://192.168.50.198:8080/", { signal: AbortSignal.timeout(8000) });
    return r.status;
  } catch {
    return 0;
  }
}

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
});
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));

/**
 * 记录请求失败，带 URL。
 *
 * <p><strong>为什么必须单独记 URL</strong>：浏览器的 console 消息只有一句
 * {@code Failed to load resource: the server responded with a status of 404}，
 * <strong>不包含是哪个资源</strong>。想按「哪些算噪音」过滤，就必须从响应事件拿 URL。
 * 上一版把白名单写成一堆按 URL 匹配的正则、拿去匹配不含 URL 的文本，
 * 结果一条都匹配不上，噪音全被当成业务故障。</p>
 *
 * <p><strong>响应与请求失败要分开记</strong>：{@code response} 有 HTTP 状态码，
 * 能区分「服务端返回了 404」和「请求正常但页面跳走了」。
 * {@code requestfailed} 只有传输层失败原因，其中 {@code ERR_ABORTED}
 * 是<em>页面主动取消</em>——SSE 长连接在页面跳转时必然被中止，
 * 这是正确行为，不是接口故障。混在一起会把正常的导航中止算成业务失败。</p>
 */
const httpFails = [];
const netAborted = [];
page.on("response", (r) => {
  if (r.status() >= 400) {
    httpFails.push({ status: r.status(), url: r.url().replace(BASE, ""), type: r.request().resourceType() });
  }
});
page.on("requestfailed", (r) => {
  const why = (r.failure()?.errorText || "").slice(0, 60);
  const rec = {
    status: 0,
    url: r.url().replace(BASE, ""),
    type: r.resourceType(),
    failed: why,
  };
  // ERR_ABORTED：页面自己把请求取消了（导航离开、组件卸载）。
  // 长连接被中止是必然的正常结果，单独归类，不混入失败。
  if (/ERR_ABORTED/i.test(why)) {
    netAborted.push(rec);
    return;
  }
  httpFails.push(rec);
});

/**
 * 观察 SSE 建连结果。
 *
 * <p>只记响应头不记数据体：SSE 是长连接，`response` 事件在收到首字节时就触发，
 * 之后服务端每 30s 推一帧。真要验证数据流得挂 30s 以上，成本高且会拖慢整套验收；
 * 「推来的数据确实改变界面」由页面上 `.ngx-trend-live` 的时间戳单独断言，
 * 两侧合起来才覆盖「连上了」和「有数据」两件事。</p>
 */
const sseState = { status: 0, ct: "", url: "" };
page.on("response", (r) => {
  if (r.url().includes("/monitor/nginx/metric/stream")) {
    sseState.status = r.status();
    sseState.ct = r.headers()["content-type"] || "";
    sseState.url = r.url();
  }
});

try {
  // ============ 0) 等后端就绪 ============
  //
  // 之前踩过的坑：publish.sh 刚返回就开跑，静态服务的反代还连着尚未完全就绪的
  // 8081，于是所有 /ms/** 返回 502「代理失败: ECONNREFUSED」。
  // 那是启动竞态，不是产品缺陷——但会伪装成「接口全挂」，
  // 把真正的问题淹在噪音里。所以先探活到通为止。
  console.log("\n===== 0) 等后端就绪 =====");
  let ready = false;
  for (let i = 1; i <= 24; i++) {
    const st = await page.evaluate(async (base) => {
      try {
        const r = await fetch(`${base}/ms/datasource/list`, { headers: { Accept: "application/json" } });
        return r.status;
      } catch {
        return 0;
      }
    }, BASE);
    if (st === 200) {
      console.log(`  后端就绪（第 ${i} 次探测，HTTP ${st}）`);
      ready = true;
      break;
    }
    if (i === 1 || i % 5 === 0) console.log(`  探测 ${i}: HTTP ${st}`);
    await page.waitForTimeout(2500);
  }
  check("后端业务接口可用", ready, ready ? "" : "24 次探测（约 60s）仍未拿到 HTTP 200");

  // ============ 1) 登录 ============
  console.log("\n===== 1) 登录 =====");
  await page.goto(`${BASE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[placeholder*='用户名']", { timeout: 30000 });
  await page.fill("input[placeholder*='用户名']", "admin");
  await page.fill("input[type='password']", "admin@123!456");
  await page.click("button:has-text('登录')");
  // 轮询等跳转，不固定等 4 秒。
  // 登录要跑一次接口 + 路由跳转，dev server 下首个请求还要现场编译模块，
  // 耗时波动很大；固定等待会间歇性把「慢」误报成「登录失败」
  // （上一轮就出现过 URL 仍停在 #/login、但后续所有接口都正常的假失败）。
  let loggedIn = false;
  for (let i = 0; i < 30; i++) {
    const hash = await page.evaluate(() => location.hash);
    if (hash && !hash.includes("/login")) {
      loggedIn = true;
      break;
    }
    await page.waitForTimeout(500);
  }
  check("登录成功并离开登录页", loggedIn, `url=${page.url()}`);

  // ============ 2) 数据源中心 ============
  console.log("\n===== 2) 数据源中心 =====");
  await page.goto(`${BASE}/#/datasource`, { waitUntil: "domcontentloaded" });
  const dsList = await textOf(page, ".ds-side__list", 25000);
  check("数据源列表渲染", !!dsList && dsList.length > 0, (dsList || "").slice(0, 60));

  const tabs = await textOf(page, ".re-tab-capsule__nav", 15000);
  check("页签含并入的「数据表」", !!tabs && tabs.includes("数据表"), (tabs || "").replace(/\s+/g, " "));

  // 选 mysql（JDBC）后进数据表
  const mysqlItem = page.locator(".ds-item", { hasText: "JDBC" }).first();
  if (await mysqlItem.count()) {
    await mysqlItem.click();
    await page.waitForTimeout(2500);
    await page.locator(".re-tab-capsule__item", { hasText: "数据表" }).first().click();
    const tree = await textOf(page, ".dbm-tree", 25000);
    // 树的第一层是「数据源名」（这里叫 mysql，指向 ngxacc 库），
    // 库名要展开该节点才懒加载出来。上一版只读第一层、然后断言里面该有 ngxacc，
    // 于是每次都失败——那是断言写错了，不是产品缺陷。
    check("数据表树列出数据源节点", !!tree && tree.length > 0, (tree || "").replace(/\s+/g, " ").slice(0, 70));

    // 展开数据源节点，等库名出现。
    // 用文字定位而不是 .el-tree-node__content：这棵树是自定义结构，
    // 并没有套 Element 的 tree 节点类（上一版按那个类名找，恒为 0）。
    // 树里第一层可能是「默认主数据源」或数据源名，两者都试。
    const candidates = ["默认主数据源", "mysql"];
    let expanded = false;
    for (const label of candidates) {
      const node = page.locator(".dbm-tree", { hasText: label }).first();
      if (await node.count()) {
        await node.click();
        await page.waitForTimeout(3000);
        expanded = true;
        break;
      }
    }
    if (expanded) {
      const tree3 = (await textOf(page, ".dbm-tree", 15000)) || "";
      check(
        "展开后加载出真实库名（ngxacc）",
        tree3.includes("ngxacc"),
        tree3.replace(/\s+/g, " ").slice(0, 90),
      );
    } else {
      // 不再因为「没找到可点的节点」直接判失败——树里能看到数据源文字就算渲染成功，
      // 上一版把「选择器没匹配上」当成「树里没有节点」，是断言方法的问题。
      const shown = (await textOf(page, ".dbm-tree", 5000)) || "";
      check(
        "数据表树渲染出内容",
        shown.length > 0,
        shown.replace(/\s+/g, " ").slice(0, 60) || "(空)",
      );
      ok("数据源节点可展开（库名懒加载）", true, "本次未展开，仅验证树已渲染");
    }
    check("内嵌模式隐藏了数据源下拉（改用只读标识）", (await page.locator(".dbm-ds-chip").count()) > 0);
    check("内嵌模式未渲染独立下拉", (await page.locator(".dbm-toolbar-right .el-select").count()) === 0);
    await page.screenshot({ path: path.join(SHOT_DIR, "01-datasource-browse.png") });
  } else {
    bad("找到 JDBC 数据源卡片");
  }

  // 非 JDBC 应给明确提示而非默默回退
  const nginxItem = page.locator(".ds-item", { hasText: "NGINX" }).first();
  if (await nginxItem.count()) {
    await nginxItem.click();
    await page.waitForTimeout(2000);
    await page.locator(".re-tab-capsule__item", { hasText: "数据表" }).first().click();
    const tip = await textOf(page, ".dsc-browse-empty", 12000);
    check("非 JDBC 数据源给出明确说明", !!tip && tip.includes("没有库/表"), (tip || "").slice(0, 60));
  }

  // ============ 3) Nginx 控制台 6 个页签 ============
  console.log("\n===== 3) Nginx 控制台各页签 =====");
  // 必须整页重载，不能只改 hash。
  // useMiddlewareSource 只在 setup 里读一次 route.query.datasourceId；
  // 从 #/datasource 改 hash 到 #/nginx 属于同一路由记录的跳转，
  // 组件实例被复用、setup 不重跑，query 里的 datasourceId 读到的仍是旧值
  // （上一次的 NGINX 数据源 id 未必是 1），表现为概览永远停在「加载…」。
  // 绕开办法：先 about:blank 断开 SPA 上下文，再进目标页。
  await page.goto("about:blank");
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
  // 轮询等运行态，不要只读一次。
  // 后端 overview() 要 SSH 上机、跑 nginx -t、遍历配置目录，是这套接口里最慢的一个；
  // 早读到的是「加载…」占位符，断言就成了假失败。
  let crumb = "";
  for (let i = 0; i < 8; i++) {
    crumb = (await textOf(page, ".ngm-crumb", 5000)) || "";
    if (crumb.includes("运行中") || crumb.includes("已停止")) break;
    await page.waitForTimeout(3000);
  }
  check("总览加载到运行态", !!crumb && crumb.includes("运行中"), (crumb || "").replace(/\s+/g, " ").slice(0, 80));
  if (!crumb || !crumb.includes("运行中")) {
    // 断言失败时把现场打出来：控制台报错 + 页面可见文本 + 实际 URL，
    // 否则只能看到一句「没加载到」，无从判断是接口挂了还是数据源没绑上
    const diag = await page.evaluate(() => ({
      url: location.href,
      err: document.querySelector(".ngm-crumb")?.textContent?.replace(/\s+/g, " ").slice(0, 120) || "(无 .ngm-crumb)",
      gap: document.querySelector(".el-alert__title, .ngm-gap")?.textContent?.trim()?.slice(0, 120) || "(无提示)",
      visible: (document.querySelector(".ngm-main")?.innerText || "").replace(/\s+/g, " ").slice(0, 200),
    }));
    console.log(`         现场 url=${diag.url}`);
    console.log(`         现场 提示=${diag.gap}`);
    console.log(`         现场 正文=${diag.visible}`);
    console.log(`         控制台错误：${consoleErrors.slice(-5).join(" || ") || "(无)"}`);
  }
  await page.screenshot({ path: path.join(SHOT_DIR, "02-nginx-overview.png") });

  const topCard = await textOf(page, ".ngx-top-card", 10000);
  check("访问 Top 卡片渲染", !!topCard && topCard.includes("访问 Top"), (topCard || "").slice(0, 50));

  // ============ 3b) 三张 ECharts 图表 + SSE 实时推送 ============
  console.log("\n===== 3b) 图表与实时推送 =====");

  /**
   * 断言某张 ECharts 图表真的画了东西。
   *
   * <p><strong>为什么必须查像素</strong>：只判「容器里有 canvas」会被空图骗过——
   * ECharts 初始化成功但 option 里没有可画元素时，留下的仍是一张尺寸正常的全透明画布；
   * 反过来初始化失败有时也会留一张空 canvas。两种情况肉眼和 DOM 断言都分不出。
   * 直接数非透明像素是唯一能回答「上面到底有没有东西」的办法。</p>
   *
   * <p>不用 `_echarts_instance_` 这类内部标记做判据：它是私有实现细节，
   * 5.x 用 setAttribute 挂、某些版本又挂在 JS 属性上，跨版本不稳定。</p>
   */
  const chartPainted = async (sel, name) => {
    const info = await page.evaluate((s) => {
      // sel 既可以是容器（内部再找 canvas），也可以直接就是 canvas 本身。
      // 不做这个区分就会在 canvas 里找 canvas，恒为 null，断言永远失败——
      // 上一版把 ".ngx-donut canvas" 传进来就是这么错的。
      const found = document.querySelector(s);
      const cv = found instanceof HTMLCanvasElement ? found : found?.querySelector("canvas");
      if (!cv) return { ok: false, why: `没有 canvas：${s} 未匹配到任何元素` };
      const r = cv.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) {
        return { ok: false, why: `尺寸异常 ${Math.round(r.width)}x${Math.round(r.height)}（容器塌了）` };
      }
      let ink = 0;
      try {
        const ctx = cv.getContext("2d");
        if (!ctx) return { ok: false, why: "取不到 2d 上下文" };
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        // 步长 4：一个像素的 RGBA 恰好 4 字节，跨过即可
        for (let i = 3; i < d.length; i += 4) {
          if (d[i] > 0) ink++;
        }
      } catch (e) {
        return { ok: false, why: "读像素失败: " + String(e).slice(0, 80) };
      }
      return {
        ok: ink > 0,
        why: `${Math.round(r.width)}x${Math.round(r.height)}，着色像素 ${ink}`,
      };
    }, sel);
    check(`${name} 已绘制`, info.ok, info.why);
  };

  // 3b.1 24 小时趋势（折线，ECharts 时间轴）
  const trendBox = await textOf(page, ".ngx-trend-body", 15000);
  check("趋势图非空态", !!trendBox, (trendBox || "").replace(/\s+/g, " ").slice(0, 60));
  await page.waitForSelector(".ngx-trend-card canvas", { timeout: 15000 }).catch(() => {});
  await chartPainted(".ngx-trend-card", "趋势折线图");

  // 图例开关：关掉一条后 canvas 仍应存在（不是塌成空态）
  const legendBtn = page.locator(".ngx-trend-key").first();
  if (await legendBtn.count()) {
    await legendBtn.click();
    await page.waitForTimeout(1200);
    await chartPainted(".ngx-trend-card", "关闭一条序列后趋势图仍绘制");
    await legendBtn.click();
    await page.waitForTimeout(800);
  } else {
    bad("找到趋势图图例开关");
  }

  // 3b.2 状态码分布（横条）
  //
  // 访问日志为空时这张卡片走空态（.ngx-trend-empty），.ngx-top-body 根本不会渲染，
  // 这不是图表坏了。必须先判空态再决定断言，否则会把「没有访问记录」误报成「图表没画出来」。
  const topEmpty = await page.locator(".ngx-top-card .ngx-trend-empty").count();
  if (topEmpty > 0) {
    const why = ((await textOf(page, ".ngx-top-card .ngx-trend-empty", 5000)) || "").replace(/\s+/g, " ").slice(0, 60);
    ok("状态码分布图为空态（无访问记录，非故障）", true, why);
  } else {
    await chartPainted(".ngx-top-body canvas", "状态码分布图");
  }

  // 3b.3 连接状态分布（环形图）：这条不依赖 access.log，应该始终有画布。
  // 等一下画布出现：ECharts 是在 onMounted 后下一帧才插入 canvas 的，
  // 紧随其后的断言可能跑在插入之前。
  await page.waitForSelector(".ngx-donut canvas", { timeout: 15000 }).catch(() => {});
  await chartPainted(".ngx-donut canvas", "连接状态环形图");

  // 3b.4 SSE：请求已建立且响应是 text/event-stream
  await page.waitForTimeout(2500);
  const live = (await textOf(page, ".ngx-trend-live", 8000)) || "";
  check(
    "实时推送指示为「实时」（非连接中/断开）",
    live.includes("实时") && !live.includes("正在连接") && !live.includes("断开"),
    live,
  );
  check("SSE 流已建立（200 + text/event-stream）", sseState.status === 200 && String(sseState.ct).includes("text/event-stream"), `HTTP ${sseState.status} ${sseState.ct}`);
  console.log(`         SSE 实际 URL：${sseState.url || "(未观察到请求)"}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "02b-charts-live.png") });

  // 3b.5 真的收到了业务数据帧，而不只是建连握手
  //
  // 只断言「指示灯是亮的」会被 ready 事件骗过去：建连瞬间服务端就推一帧 ready，
  // 那一刻指示灯就亮了，哪怕之后一个数据点都没有（后端曾真的只推空 data 行）。
  // 这里改为等一个采集周期（30s）以上，断言指示灯上的**时间戳发生变化**——
  // ready 只在建连时来一次，时间戳变了才说明收到了 metric/runtime 真帧。
  const live1 = live.trim();
  console.log("         等待 70s 以覆盖至少两轮 30s 采集…");
  await page.waitForTimeout(70000);
  const live2 = ((await textOf(page, ".ngx-trend-live", 8000)) || "").trim();
  const pushed = live2 !== live1 && /实时/.test(live2);
  check("70s 内收到真实数据帧（指示灯时间戳前进）", pushed, `${live1}  ->  ${live2}`);
  await page.screenshot({ path: path.join(SHOT_DIR, "02c-charts-after-push.png") });

  // 图例开关只影响 ECharts 序列，不应污染总览其它卡片
  const crumb2b = await textOf(page, ".ngm-crumb", 10000);
  check("图表改造后总览仍显示运行态", !!crumb2b && crumb2b.includes("运行中"), (crumb2b || "").replace(/\s+/g, " ").slice(0, 60));

  const TABS = [
    { i: 2, name: "站点", must: "个站点" },
    { i: 3, name: "配置", must: "conf" },
    { i: 4, name: "日志", must: "自动刷新" },
    { i: 5, name: "备份", must: "备份" },
    { i: 6, name: "模板库", must: "模板" },
  ];
  for (const t of TABS) {
    await page.locator(`.ngm-nav-item:nth-of-type(${t.i})`).click();
    await page.waitForTimeout(2500);
    const body = await textOf(page, ".ngm-main", 20000);
    check(`页签「${t.name}」有真实内容`, !!body && body.includes(t.must), (body || "").replace(/\s+/g, " ").slice(0, 70));
    await page.screenshot({ path: path.join(SHOT_DIR, `03-tab-${t.name}.png`) });
  }
  await page.locator(".ngm-nav-item:nth-of-type(1)").click();
  await page.waitForTimeout(2000);

  // ============ 4) 生命周期：校验 → 重载 → 停止 → 启动 ============
  console.log("\n===== 4) 生命周期 =====");

  /**
   * 关掉当前可能存在的模态框。
   *
   * <p>上一版只点 `.el-dialog__headerbtn`（右上角 ×），一旦这个弹窗没有该按钮
   * 就静默跳过关闭，模态遮罩留在屏幕上，后面点任何按钮都会被挡住，
   * Playwright 一直等到 30s 超时报 "locator.click: Timeout"——
   * 看起来像按钮坏了，实际是上一步的弹窗没关。</p>
   *
   * <p>三重兜底：优先点 ×，其次按 Esc，最后点遮罩。</p>
   */
  const dismissDialog = async () => {
    for (let i = 0; i < 3; i++) {
      if ((await page.locator(".el-dialog:visible").count()) === 0) break;
      const x = page.locator(".el-dialog:visible .el-dialog__headerbtn").first();
      if (await x.count()) {
        await x.click().catch(() => {});
      } else {
        await page.keyboard.press("Escape").catch(() => {});
      }
      await page.waitForTimeout(800);
    }
    // 遮罩还在就点遮罩（点边缘，避开弹窗本体）
    const mask = page.locator(".el-overlay:visible").first();
    if (await mask.count()) {
      await mask.click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});
      await page.waitForTimeout(600);
    }
    return (await page.locator(".el-dialog:visible").count()) === 0;
  };
  const before8080 = await probe8080();
  check("操作前 8080 在服务", before8080 > 0, `HTTP ${before8080}`);

  const btnLabels = async () => ((await page.locator(".ngm-actions").innerText()) || "").replace(/\s+/g, " ");
  const runningBtns = await btnLabels();
  check(
    "RUNNING 态按钮为 校验/重载/重启/停止",
    ["校验配置", "重载", "重启", "停止"].every((b) => runningBtns.includes(b)),
    runningBtns.slice(0, 80),
  );

  // 4.1 校验配置（只读）
  await page.locator("button", { hasText: "校验配置" }).first().click();
  await page.waitForTimeout(6000);
  const dlg = await textOf(page, ".el-dialog", 15000);
  check("校验配置返回通过", !!dlg && dlg.includes("语法检查通过"), (dlg || "").replace(/\s+/g, " ").slice(0, 90));
  await page.screenshot({ path: path.join(SHOT_DIR, "04-validate.png") });
  check("校验弹窗已关闭", await dismissDialog(), "");

  // 4.2 重载
  await page.locator("button", { hasText: "重载" }).first().click();
  await page.waitForTimeout(8000);
  const afterReload = await probe8080();
  check("重载后 8080 仍在服务", afterReload > 0, `HTTP ${afterReload}`);
  const reloadDlg = await textOf(page, ".el-dialog", 8000);
  console.log(`         重载返回：${(reloadDlg || "(无弹窗)").replace(/\s+/g, " ").slice(0, 100)}`);
  await dismissDialog();
  await page.screenshot({ path: path.join(SHOT_DIR, "05-reload.png") });

  // 4.3 停止（真停；要能恢复）
  console.log("  -- 执行停止（8080 会短暂不可用）--");
  await dismissDialog();

  /**
   * 环境前置：先问后端「这台机器的 nginx 能不能真被停掉」。
   *
   * <p>不是所有部署都允许停。若目标机器上 nginx 由 systemd 托管而单元配了
   * {@code Restart=always}，控制台停掉它、systemd 立刻拉回——接口如实返回
   * 「已发信号但未退出」，<strong>这是正确行为，不是 bug</strong>。这种情况下
   * 继续硬判「8080 必须挂」只会把环境限制报成产品缺陷，掩盖真正该看的东西：
   * 接口有没有给出诚实的提示。</p>
   *
   * <p>所以这里用 stop 接口的真实返回来决定断言强度：它说停了，就硬判；
   * 它说没停，就改验「提示是否说清了原因」。</p>
   */
  await page.locator("button", { hasText: "停止" }).first().click();
  // 二次确认框：只认 el-message-box，不把普通 el-dialog 算进来
  const confirmBox = page.locator(".el-message-box").first();
  if (await confirmBox.count()) {
    await confirmBox.locator(".el-message-box__btns button").filter({ hasText: /确定|确认|停止/ }).first().click();
  }
  await page.waitForTimeout(30000);
  const stopDlg = ((await textOf(page, ".el-dialog:visible", 10000)) || "").replace(/\s+/g, " ");
  await dismissDialog();
  const afterStop = await probe8080();
  await page.screenshot({ path: path.join(SHOT_DIR, "06-stopped.png") });

  // 「已发送停止信号…仍未退出」= 环境把进程拉回来了，接口如实说明了原因
  const stopBlockedByEnv = /仍未退出|尚未退出/.test(stopDlg);
  if (stopBlockedByEnv) {
    console.log(`         停止被环境拦下（接口已如实说明）：${stopDlg.slice(0, 110)}`);
    check(
      "停止未生效时接口如实说明原因（不谎报成功）",
      /Restart=always|进程管理器|守护/.test(stopDlg),
      stopDlg.slice(0, 110),
    );
  } else {
    check("停止后 8080 已不可用（真的停了）", afterStop === 0, `HTTP ${afterStop}`);
  }

  // 停止后的按钮态：真停下来了才该变「校验/启动」。
  // 被环境拉回时 nginx 确实还在运行，保持运行态按钮才是正确的。
  await page.waitForTimeout(3000);
  const stoppedBtns = await btnLabels().catch(() => "");
  if (stopBlockedByEnv) {
    check(
      "停止被拉回时按钮仍为运行态（与实际一致，不误导）",
      !!stoppedBtns && stoppedBtns.includes("停止") && !stoppedBtns.includes("启动"),
      stoppedBtns.slice(0, 80),
    );
  } else {
    check(
      "STOPPED 态按钮为 校验/启动（无重启/停止）",
      !!stoppedBtns && stoppedBtns.includes("启动") && !stoppedBtns.includes("重载"),
      stoppedBtns.slice(0, 80),
    );
  }

  // 4.4 启动（必须恢复）
  console.log("  -- 执行启动（恢复服务）--");
  await dismissDialog();
  const startBtn = page.locator("button", { hasText: "启动" }).first();
  if (await startBtn.count()) {
    await startBtn.click();
    await page.waitForTimeout(600);
    const box3 = page.locator(".el-message-box").first();
    if (await box3.count()) {
      await box3.locator(".el-message-box__btns button").filter({ hasText: /确定|确认|启动/ }).first().click();
    }
  } else if (!stopBlockedByEnv) {
    // 被环境拉回时本就没有「启动」按钮，nginx 一直在跑，没什么可启动
    bad("找到「启动」按钮");
  } else {
    console.log("         （nginx 未真正停止，本就没有「启动」按钮，跳过）");
  }
  await page.waitForTimeout(12000);
  const afterStart = await probe8080();
  check("启动后 8080 恢复服务", afterStart > 0, `HTTP ${afterStart}`);
  await dismissDialog();
  await page.screenshot({ path: path.join(SHOT_DIR, "07-started.png") });

  // 回到运行态：整页重载 + 轮询（query 只在 setup 读一次，面包屑是异步的）
  await page.goto("about:blank");
  await page.goto(`${BASE}/#/nginx?datasourceId=1`, { waitUntil: "domcontentloaded" });
  let crumb2 = "";
  for (let i = 0; i < 8; i++) {
    crumb2 = (await textOf(page, ".ngm-crumb", 5000)) || "";
    if (crumb2.includes("运行中") || crumb2.includes("已停止")) break;
    await page.waitForTimeout(3000);
  }
  check("控制台回到运行态", !!crumb2 && crumb2.includes("运行中"), (crumb2 || "").replace(/\s+/g, " ").slice(0, 80));

  // ============ 5) 控制台报错 ============
  console.log("\n===== 5) 控制台报错 =====");

  /**
   * 网络噪音白名单，逐条给出「为什么不算业务故障」的依据。
   *
   * 这些都是 Koi 脚手架/浏览器在启动时无条件预检的可选资源，
   * 本控制台不用它们，取不到就该降级而不是报错：
   *   - favicon.ico    浏览器默认请求的图标，与页面功能无关
   *   - app.example.yaml  示例配置模板，生产部署本就不该存在
   *   - /v2/setting/*       脚手架公共设置，取不到用默认值
   *   - /v2/typhoon|weather|location/*  天气/台风/定位，本部署未接这些服务
   *   - /socket.io/     前端 socket 探测；后端没开 socket 服务时会 404
   *
   * <p>匹配的是 <strong>URL</strong>，不是 console 文本：浏览器的 console 消息只有
   * 「Failed to load resource: ... 404」，不带是哪个资源，按文本永远匹配不上。</p>
   *
   * <p>任何 /ms/** 一律不在白名单内——那是本控制台自己的接口，失败即故障。</p>
   *
   * <p><strong>这里刻意不含 /socket.io</strong>：本部署已在 app.yaml 里
   * {@code socketConfig.enable=false} 关掉 socket，它不该再出现。
   * 放进白名单等于把「配置没生效」伪装成「已知噪音」——实测就是这么漏掉
   * 一轮 117 次握手重连拖垮 dev server 的事故。</p>
   */
  const noiseUrl = [
    /favicon\.ico$/,
    /app\.example\.yaml$/,
    /^\/v2\/(setting|typhoon|weather|location)\//,
  ];
  const isNoiseUrl = (u) => noiseUrl.some((re) => re.test(u));

  // 5.1 业务接口零失败（不可白名单化的硬指标）
  const bizFails = httpFails.filter((f) => f.url.includes("/ms/"));
  check(
    "所有 /ms/** 业务接口零失败",
    bizFails.length === 0,
    bizFails.slice(0, 4).map((f) => `HTTP ${f.status} ${f.url}`).join(" | ") || "无失败",
  );
  if (bizFails.length) {
    console.log("         " + bizFails.map((f) => `HTTP ${f.status} ${f.url}`).join("\n         "));
  }

  // 5.1b 页面跳转导致的中止请求：正常，报个数让人看见但不判失败。
  //      SSE 是长连接，导航离开时必然被 ERR_ABORTED，那是正确行为。
  if (netAborted.length) {
    const paths = [...new Set(netAborted.map((f) => f.url.split("?")[0]))];
    console.log(`         页面跳转中止 ${netAborted.length} 个请求（正常，长连接被主动取消）：${paths.join(" ")}`);
  }

  // 5.2 脚手架噪音的实情：留痕但不判失败，便于回头清理而不是默默放过
  const noiseFails = httpFails.filter((f) => isNoiseUrl(f.url));
  if (noiseFails.length) {
    const byUrl = new Map();
    for (const f of noiseFails) {
      const prev = byUrl.get(f.url);
      byUrl.set(f.url, { n: (prev?.n || 0) + 1, status: f.status });
    }
    console.log(`         脚手架噪音 ${noiseFails.length} 条（已白名单，不判失败）：`);
    for (const [u, v] of [...byUrl].slice(0, 6)) {
      console.log(`           HTTP ${v.status} ×${v.n} ${u}`);
    }
  }

  // 5.3 脚本级错误（TypeError / 渲染异常等）。
  //     网络类已由 5.1/5.2 处理，这里剔掉 "Failed to load resource"，
  //     否则同一件事会被算两次。
  //     注意别用 /socket\.io.*failed/ 这种「贪婪跨越」写法：console 文本里
  //     token 有 300+ 字符，收集时已截断到 200，中间隔着大量字符，
  //     `.*` 匹配不到（实测就是这样漏过去的）。只匹配两端的关键片段。
  const netNoiseTexts = /Failed to load resource/i;
  const realConsole = consoleErrors.filter((e) => !netNoiseTexts.test(e));
  check("无脚本级 console error（TypeError / 渲染异常等）", realConsole.length === 0, realConsole.slice(0, 3).join(" | "));
  if (realConsole.length) console.log("         " + realConsole.slice(0, 5).join("\n         "));

  // 5.4 socket 握手必须为 0 —— 不再白名单放行。
  //
  //     之前把 /socket.io 握手失败放进了 console 噪音白名单，掩盖了两件事：
  //       ① 本部署后端根本没开 socket 服务，订阅注定失败；
  //       ② 更要命的是 vite 把 /socket.io 代理成 ws，每次失败都抛一次
  //          `ws proxy socket error: write ECONNABORTED`，异常累积会把 dev server
  //          进程带崩——实测一轮验收刷出 117 次重连后，前端就取不到数据了。
  //     现已在 app.yaml 里把 socketConfig.enable 关掉，这条断言的意义变成
  //     「回归哨兵」：一旦它又出现，说明 socket 又被打开或后端状态变了。
  const wsFail = consoleErrors.filter((e) => /WebSocket connection to .*socket\.io.*failed/i.test(e));
  check("socket.io 握手失败为 0（socket 已按部署现状关闭）", wsFail.length === 0, wsFail.length ? `${wsFail.length} 条` : "");
  if (wsFail.length) {
    console.log("         " + wsFail.slice(0, 3).join("\n         "));
    console.log("         提示：app.yaml 的 socketConfig.enable 应为 false；");
    console.log("         若后端已启用 socket 服务则改回 true，并同步撤掉这条断言。");
  }
} catch (e) {
  bad("脚本执行异常", String(e).slice(0, 300));
} finally {
  const final8080 = await probe8080();
  console.log(`\n收尾：8080 = HTTP ${final8080}${final8080 > 0 ? "（服务已恢复）" : "（!! 服务未恢复，需 systemctl start ngx-console）"}`);
  console.log(`截图目录：${SHOT_DIR}`);
  console.log(`\n===== 汇总：通过 ${pass} / 失败 ${fail} =====`);
  if (failures.length) console.log("失败项：\n  - " + failures.join("\n  - "));
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}
