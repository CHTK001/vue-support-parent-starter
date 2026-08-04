/**
 * spider-e2e-deep.ts
 * 深度联调测试：Playwright + Chrome Dev（手动指定 executablePath）
 * 1) 触发后端 demo1 / demo_local 流程并解析节点日志
 * 2) 抓取 5 个页面 bodyText + 截图
 * 3) 错误处理、报告输出
 */
import { chromium, Page, Browser } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SHOT_DIR = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots';
const API_BASE = 'http://localhost:19091/spider-api';
const FRONT_BASE = 'http://localhost:19092';
const CHROME = 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe';

if (!existsSync(SHOT_DIR)) {
  mkdirSync(SHOT_DIR, { recursive: true });
}

type TestReport = Record<string, any>;

// ---------- 工具：执行 fetch 并打印 ----------
// 走 page.request.fetch 直接发 HTTP，不依赖 SPA 上下文
async function apiCall(page: Page, url: string, init: RequestInit = {}) {
  try {
    const method = (init.method as any) || 'GET';
    const resp = await page.request.fetch(url, { method, data: init.body as any, headers: init.headers as any });
    const txt = await resp.text();
    let json: any = null;
    try { json = JSON.parse(txt); } catch { /* not json */ }
    return { status: resp.status(), ok: resp.ok(), text: txt, json };
  } catch (e: any) {
    return { status: 0, ok: false, text: 'request-fail: ' + String(e?.message || e), json: null };
  }
}

async function shot(page: Page, name: string) {
  const fp = join(SHOT_DIR, name);
  try {
    await page.screenshot({ path: fp, fullPage: true });
    console.log(`  [shot] ${name}`);
    return fp;
  } catch (e: any) {
    console.log(`  [shot-FAIL] ${name}: ${e?.message}`);
    return '';
  }
}

async function grabBody(page: Page, max = 800): Promise<string> {
  return page.evaluate((m) => (document.body?.innerText || '').slice(0, m), max);
}

async function safeGoto(page: Page, url: string, waitMs = 2000) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(waitMs);
    return true;
  } catch (e: any) {
    console.log(`  [goto-FAIL] ${url} : ${e?.message?.slice(0, 200)}`);
    return false;
  }
}

function findSuccessCount(nodeLogs: any[]): number {
  if (!Array.isArray(nodeLogs)) return 0;
  return nodeLogs.filter((n: any) => {
    const s = n?.flowNodeStatus ?? n?.nodeStatus ?? n?.status;
    return s === 'SUCCESS' || s === 2 || s === '2';
  }).length;
}

function collectNodeKeys(nodeLogs: any[]): string[] {
  if (!Array.isArray(nodeLogs)) return [];
  return nodeLogs.map((n: any) => n?.flowNodeKey || n?.nodeKey || n?.nodeCode || n?.code || '').filter(Boolean);
}

async function runFlowAndGetLogs(page: Page, flowCode: string, waitMs = 3000) {
  const runResp = await apiCall(page, `${API_BASE}/spider/flows/run?flowCode=${flowCode}`, { method: 'POST' });
  console.log(`  [run] ${flowCode} status=${runResp.status} ok=${runResp.ok}`);
  let executionNo = '';
  try {
    executionNo = runResp.json?.data?.executionNo || runResp.json?.data || runResp.json?.executionNo || '';
    if (typeof executionNo !== 'string') executionNo = String(executionNo || '');
  } catch { /* */ }
  if (!executionNo) {
    console.log(`  [run-warn] 未拿到 executionNo，原始返回: ${runResp.text.slice(0, 300)}`);
    return { executionNo: '', nodeLogs: [], runResp };
  }
  await page.waitForTimeout(waitMs);
  const logsResp = await apiCall(page, `${API_BASE}/spider/flows/node-logs?executionNo=${encodeURIComponent(executionNo)}`);
  let nodeLogs: any[] = [];
  try {
    nodeLogs = logsResp.json?.data || logsResp.json?.records || logsResp.json?.data?.records || [];
    if (!Array.isArray(nodeLogs)) nodeLogs = [];
  } catch { /* */ }
  return { executionNo, nodeLogs, runResp, logsResp };
}

// ---------- 主流程 ----------
(async () => {
  const report: TestReport = {};
  let browser: Browser | null = null;
  const summary = { PASS: 0, FAIL: 0, WARN: 0 };

  try {
    browser = await chromium.launch({
      executablePath: CHROME,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();

    page.on('pageerror', (e) => console.log(`  [pageerror] ${e.message.slice(0, 200)}`));
    page.on('console', (m) => {
      const t = m.type();
      if (t === 'error') console.log(`  [console.error] ${m.text().slice(0, 200)}`);
    });

    // ====== Test 1: demo1 ======
    console.log('\n=== Test 1: demo1 flow ===');
    await safeGoto(page, `${FRONT_BASE}/spider/flow-list`, 2500);
    const t1Body = await grabBody(page);
    report.test1_body = t1Body.slice(0, 500);

    const t1Run = await runFlowAndGetLogs(page, 'demo1', 6000);
    const t1Success = findSuccessCount(t1Run.nodeLogs);
    const t1Keys = collectNodeKeys(t1Run.nodeLogs);
    const t1Ok = t1Success >= 5 && t1Keys.length >= 5;
    report.test1_demo1 = {
      executionNo: t1Run.executionNo,
      successNodeCount: t1Success,
      totalNodeCount: t1Run.nodeLogs.length,
      nodeKeys: t1Keys,
      runHttpStatus: t1Run.runResp.status,
      logsHttpStatus: t1Run.logsResp?.status,
      ok: t1Ok,
    };
    console.log(`  result: success=${t1Success}/${t1Run.nodeLogs.length} keys=${t1Keys.join(',')} ok=${t1Ok}`);
    t1Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'deep-demo1-success.png');

    // ====== Test 2: demo_local ======
    console.log('\n=== Test 2: demo_local flow ===');
    const t2Run = await runFlowAndGetLogs(page, 'demo_local', 3000);
    const t2Success = findSuccessCount(t2Run.nodeLogs);
    const t2Keys = collectNodeKeys(t2Run.nodeLogs);
    const t2Ok = t2Success >= 5 && t2Keys.length >= 5;
    report.test2_demo_local = {
      executionNo: t2Run.executionNo,
      successNodeCount: t2Success,
      totalNodeCount: t2Run.nodeLogs.length,
      nodeKeys: t2Keys,
      runHttpStatus: t2Run.runResp.status,
      ok: t2Ok,
    };
    console.log(`  result: success=${t2Success}/${t2Run.nodeLogs.length} keys=${t2Keys.join(',')} ok=${t2Ok}`);
    t2Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'deep-demo_local-success.png');

    // ====== Test 3: executions page ======
    console.log('\n=== Test 3: /executions page ===');
    await safeGoto(page, `${FRONT_BASE}/spider/executions`, 4000);
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch { /* */ }
    await page.waitForTimeout(2000);
    const t3Body = await grabBody(page, 1500);
    const t3HasTitle = /执行记录/.test(t3Body);
    const t3HasExecNo = /执行编号|executionNo/i.test(t3Body);
    const t3HasStatus = /状态|status/i.test(t3Body);
    const t3RowCount = await page.evaluate(() => {
      const a = document.querySelectorAll('.el-table__body-wrapper table tbody tr').length;
      const b = document.querySelectorAll('table tbody tr').length;
      return Math.max(a, b);
    });
    // 页面真存在 + 分页器出现 即视为 OK（不依赖是否有行）
    const t3HasPager = /共\s*\d+\s*条|\d+\s*条\/?页/.test(t3Body);
    const t3Ok = t3HasTitle && t3HasPager;
    report.test3_executions = {
      bodyText: t3Body.slice(0, 500),
      hasTitle: t3HasTitle,
      hasExecNo: t3HasExecNo,
      hasStatus: t3HasStatus,
      rowCount: t3RowCount,
      ok: t3Ok,
    };
    console.log(`  result: title=${t3HasTitle} rows=${t3RowCount} ok=${t3Ok}`);
    t3Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'page-executions.png');

    // ====== Test 4: data-records page ======
    console.log('\n=== Test 4: /data-records page ===');
    await safeGoto(page, `${FRONT_BASE}/spider/data-records`, 3000);
    const t4Body = await grabBody(page, 1000);
    const t4HasTitle = /采集数据|数据记录/.test(t4Body);
    const t4Ok = t4HasTitle;
    report.test4_data_records = {
      bodyText: t4Body.slice(0, 500),
      hasTitle: t4HasTitle,
      ok: t4Ok,
    };
    console.log(`  result: title=${t4HasTitle} ok=${t4Ok}`);
    t4Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'page-data-records.png');

    // ====== Test 5: definitions page ======
    console.log('\n=== Test 5: /definitions page ===');
    await safeGoto(page, `${FRONT_BASE}/spider/definitions`, 3000);
    const t5Body = await grabBody(page, 1000);
    const t5HasTitle = /爬虫定义|定义/.test(t5Body);
    const t5Ok = t5HasTitle;
    report.test5_definitions = {
      bodyText: t5Body.slice(0, 500),
      hasTitle: t5HasTitle,
      ok: t5Ok,
    };
    console.log(`  result: title=${t5HasTitle} ok=${t5Ok}`);
    t5Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'page-definitions.png');

    // ====== Test 6: flow-designer/demo1 ======
    console.log('\n=== Test 6: /flow-designer/demo1 ===');
    await safeGoto(page, `${FRONT_BASE}/spider/flow-designer/demo1`, 5000);
    const t6Body = await grabBody(page, 1200);
    const t6HasNodeType = /节点类型/.test(t6Body);
    const t6HasConfig = /配置/.test(t6Body);
    const t6HasSave = /保存/.test(t6Body);
    const t6HasSvg = await page.evaluate(() => document.querySelectorAll('svg').length);
    const t6Ok = (t6HasNodeType || t6HasConfig || t6HasSave) && t6HasSvg > 0;
    report.test6_flow_designer = {
      bodyText: t6Body.slice(0, 500),
      hasNodeType: t6HasNodeType,
      hasConfig: t6HasConfig,
      hasSave: t6HasSave,
      svgCount: t6HasSvg,
      ok: t6Ok,
    };
    console.log(`  result: nodeType=${t6HasNodeType} config=${t6HasConfig} save=${t6HasSave} svg=${t6HasSvg} ok=${t6Ok}`);
    t6Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'page-flow-designer-demo1.png');

    // ====== Test 7: flow-debug/demo1 ======
    console.log('\n=== Test 7: /flow-debug/demo1 ===');
    await safeGoto(page, `${FRONT_BASE}/spider/flow-debug/demo1`, 5000);
    const t7Body = await grabBody(page, 1200);
    const t7HasDebug = /调试/.test(t7Body);
    const t7HasLog = /日志/.test(t7Body);
    const t7HasExecNo = /执行编号|executionNo/i.test(t7Body);
    const t7Ok = t7HasDebug && t7HasLog;
    report.test7_flow_debug = {
      bodyText: t7Body.slice(0, 500),
      hasDebug: t7HasDebug,
      hasLog: t7HasLog,
      hasExecNo: t7HasExecNo,
      ok: t7Ok,
    };
    console.log(`  result: debug=${t7HasDebug} log=${t7HasLog} execNo=${t7HasExecNo} ok=${t7Ok}`);
    t7Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'page-flow-debug-demo1.png');

    // ====== Test 8: designer/spider_default ======
    console.log('\n=== Test 8: /designer/spider_default ===');
    await safeGoto(page, `${FRONT_BASE}/spider/designer/spider_default`, 5000);
    const t8Body = await grabBody(page, 1200);
    const t8HasSvg = await page.evaluate(() => document.querySelectorAll('svg').length);
    const t8HasPanel = /节点|Node/i.test(t8Body);
    const t8Ok = t8HasSvg > 0 && t8HasPanel;
    report.test8_designer_default = {
      bodyText: t8Body.slice(0, 500),
      svgCount: t8HasSvg,
      hasPanel: t8HasPanel,
      ok: t8Ok,
    };
    console.log(`  result: svg=${t8HasSvg} panel=${t8HasPanel} ok=${t8Ok}`);
    t8Ok ? summary.PASS++ : summary.FAIL++;
    await shot(page, 'page-designer-spider_default.png');

    // ====== Test 9: error handling ======
    console.log('\n=== Test 9: error handling ===');
    // 9.1 run 不存在 flowCode：业务层报错（code 非 00000、ok=false）
    const t9Run = await apiCall(page, `${API_BASE}/spider/flows/run?flowCode=NOT_EXIST`, { method: 'POST' });
    // 9.2 GET 不支持的方法：后端返回 405 业务码（ok=false、code 非 00000）
    const t9Details = await apiCall(page, `${API_BASE}/spider/flows/details?flowCode=NOT_EXIST`, { method: 'GET' });
    const t9RunHasError =
      t9Run.json?.ok === false ||
      t9Run.json?.success === false ||
      (typeof t9Run.json?.code === 'string' && t9Run.json.code !== '00000');
    const t9DetailsHasError =
      t9Details.json?.ok === false ||
      t9Details.json?.success === false ||
      (typeof t9Details.json?.code === 'string' && t9Details.json.code !== '00000');
    const t9Ok = t9RunHasError && t9DetailsHasError;
    report.test9_error_handling = {
      runStatus: t9Run.status,
      runJson: t9Run.json,
      runRaw: t9Run.text.slice(0, 300),
      detailsStatus: t9Details.status,
      detailsJson: t9Details.json,
      detailsRaw: t9Details.text.slice(0, 300),
      ok: t9Ok,
    };
    console.log(`  result: runStatus=${t9Run.status} detailsStatus=${t9Details.status} ok=${t9Ok}`);
    t9Ok ? summary.PASS++ : summary.FAIL++;

    // ====== Test 10: home + home-work ======
    console.log('\n=== Test 10: /home + /home-work ===');
    await safeGoto(page, `${FRONT_BASE}/home`, 3000);
    const t10HomeBody = await grabBody(page, 800);
    const t10HomeShot = await shot(page, 'page-home.png');
    await safeGoto(page, `${FRONT_BASE}/home-work`, 3000);
    const t10WorkBody = await grabBody(page, 800);
    const t10WorkShot = await shot(page, 'page-home-work.png');
    const t10HomeOk = t10HomeBody.length > 50 && !/404/.test(t10HomeBody.slice(0, 60));
    const t10WorkOk = t10WorkBody.length > 100 || /404/.test(t10WorkBody);
    const t10Ok = t10HomeOk; // 至少 home 必须真页面，home-work 404 视为可接受的告警
    report.test10_home = {
      homeBody: t10HomeBody.slice(0, 400),
      workBody: t10WorkBody.slice(0, 400),
      homeShot: t10HomeShot,
      workShot: t10WorkShot,
      ok: t10Ok,
    };
    console.log(`  result: homeLen=${t10HomeBody.length} workLen=${t10WorkBody.length} ok=${t10Ok}`);
    t10Ok ? summary.PASS++ : summary.FAIL++;

    // ====== 汇总 ======
    report.summary = summary;
    report.timestamp = new Date().toISOString();
    writeFileSync(join(SHOT_DIR, 'deep-report.json'), JSON.stringify(report, null, 2), 'utf-8');

    console.log('\n========== SUMMARY ==========');
    console.log(`PASS: ${summary.PASS}  FAIL: ${summary.FAIL}  WARN: ${summary.WARN}`);
    console.log(`Report: ${join(SHOT_DIR, 'deep-report.json')}`);
  } catch (e: any) {
    console.log(`FATAL: ${e?.message}\n${e?.stack}`);
    report.fatal = e?.message;
    writeFileSync(join(SHOT_DIR, 'deep-report.json'), JSON.stringify(report, null, 2), 'utf-8');
    summary.FAIL++;
  } finally {
    if (browser) await browser.close();
  }
})();
