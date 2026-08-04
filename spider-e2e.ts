import { chromium, Page, Browser, ConsoleMessage } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://127.0.0.1:19092';
const SHOTS = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots';
mkdirSync(SHOTS, { recursive: true });

interface CheckResult {
  name: string;
  url: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  note: string;
}

const results: CheckResult[] = [];
const consoleErrors: { url: string; errs: string[] }[] = [];
const networkErrors: { url: string; failures: { url: string; status?: number; err: string }[] }[] = [];

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}\\${name}.png`, fullPage: true });
}

async function humanDelay(min = 400, max = 1200): Promise<void> {
  const ms = min + Math.random() * (max - min);
  await new Promise((r) => setTimeout(r, ms));
}

async function visit(page: Page, path: string, label: string, expectTexts: string[] = []): Promise<CheckResult> {
  const start = Date.now();
  const errs: string[] = [];
  const networkFails: { url: string; status?: number; err: string }[] = [];

  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errs.push(msg.text());
  };
  const requestFailedHandler = (req: any) => {
    networkFails.push({ url: req.url(), err: req.failure()?.errorText || 'unknown' });
  };
  const responseHandler = (res: any) => {
    if (res.status() >= 500) {
      networkFails.push({ url: res.url(), status: res.status(), err: 'HTTP 5xx' });
    }
  };

  page.on('console', consoleHandler);
  page.on('requestfailed', requestFailedHandler);
  page.on('response', responseHandler);

  let status: 'PASS' | 'FAIL' | 'WARN' = 'PASS';
  let note = '';

  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // SPA 异步加载：等 networkidle + 给人眼读取时间
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await humanDelay(1500, 2500);

    const pageTitle = await page.title();
    const bodyText = (await page.locator('body').textContent({ timeout: 8000 }).catch(() => '')) || '';
    const visibleText = bodyText.replace(/\s+/g, ' ').trim();

    if (visibleText.length > 0) {
      console.log(`    [${label}] bodyText(${visibleText.length} chars) preview: ${visibleText.substring(0, 120)}`);
    } else {
      console.log(`    [${label}] bodyText EMPTY`);
    }

    for (const t of expectTexts) {
      if (!visibleText.includes(t)) {
        status = 'WARN';
        note += `expected text not found: "${t}"; `;
      }
    }

    if (errs.length > 0) {
      consoleErrors.push({ url: path, errs });
      if (errs.some((e) => !e.includes('favicon'))) {
        status = status === 'PASS' ? 'WARN' : status;
        note += `${errs.length} console error(s); `;
      }
    }
    if (networkFails.length > 0) {
      networkErrors.push({ url: path, failures: networkFails });
      if (networkFails.some((f) => f.status && f.status >= 500)) {
        status = 'FAIL';
        note += `${networkFails.length} network failure(s); `;
      }
    }

    await shot(page, label);
    note = `${pageTitle} | ${note}`.trim();
  } catch (e: any) {
    status = 'FAIL';
    note = `exception: ${e.message}`;
    await shot(page, `${label}-FAIL`).catch(() => {});
  } finally {
    page.off('console', consoleHandler);
    page.off('requestfailed', requestFailedHandler);
    page.off('response', responseHandler);
  }

  const result: CheckResult = { name: label, url: path, status, duration: Date.now() - start, note };
  results.push(result);
  const tag = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  console.log(`${tag} [${result.duration}ms] ${label.padEnd(28)} ${path.padEnd(40)} ${note}`);
  return result;
}

async function main(): Promise<void> {
  console.log('=== Spider 中心 E2E 真实模拟测试 ===\n');
  const browser: Browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();

  // 1. 首页
  await visit(page, '/', '01-home', ['爬虫', 'spider']);

  // 2. 路由表真实路径（@repo/spider 全部以 /spider/** 开头）
  await visit(page, '/home', '02-home-work', ['work', '首页']);
  await visit(page, '/spider/definitions', '03-definitions', ['定义', 'spider']);
  await visit(page, '/spider/flow-list', '04-flow-list', ['流程', 'flow']);
  await visit(page, '/spider/flow-designer/demo1', '05-flow-designer-demo1', []);
  await visit(page, '/spider/flow-designer/demo_local', '06-flow-designer-demo_local', []);
  await visit(page, '/spider/flow-debug/demo1', '07-flow-debug-demo1', []);
  await visit(page, '/spider/designer/spider_default', '08-designer-spider_default', []);
  await visit(page, '/spider/data-records', '09-data-records', ['数据', 'record']);
  await visit(page, '/spider/executions', '10-executions', ['执行', '记录']);

  // 3. 真实交互：跑 demo1 异步流程
  console.log('\n--- 交互测试：触发 demo1 异步执行 ---');
  try {
    // 先发请求再注册等待器，避免竞态
    const execNo = await page.evaluate(async () => {
      const r = await fetch('http://localhost:19091/spider-api/spider/flows/run?flowCode=demo1', { method: 'POST' });
      const j = await r.json();
      return { status: r.status, data: j?.data, code: j?.code };
    });
    console.log(`  run HTTP ${execNo.status} code=${execNo.code} executionNo=${execNo.data}`);
    if (!execNo.data || execNo.data === 'PENDING') {
      console.log('  ✗ executionNo 缺失或仍为 PENDING');
      results.push({ name: 'interactive-run-demo1', url: '/spider/flows/run', status: 'FAIL', duration: 0, note: `execNo=${execNo.data}` });
    } else {
      await humanDelay(2500, 3500);
      const logs = await page.evaluate(async (no) => {
        const r = await fetch(`http://localhost:19091/spider-api/spider/flows/node-logs?executionNo=${no}`);
        const j = await r.json();
        return j?.data || [];
      }, execNo.data);
      console.log(`  node-logs 收到 ${logs.length} 条`);
      const pended = logs.filter((l: any) => l.flowExecutionNo === 'PENDING').length;
      const uuids = logs.filter((l: any) => l.flowExecutionNo === execNo.data).length;
      console.log(`  PENDING 残留: ${pended}, 真实 UUID 命中: ${uuids}`);
      results.push({
        name: 'interactive-run-demo1',
        url: '/spider/flows/run',
        status: pended === 0 && uuids > 0 ? 'PASS' : 'FAIL',
        duration: 0,
        note: `execNo=${execNo.data} pended=${pended} uuids=${uuids}`,
      });
    }
  } catch (e: any) {
    console.log(`  ✗ 交互失败: ${e.message}`);
    results.push({ name: 'interactive-run-demo1', url: '/spider/flows/run', status: 'FAIL', duration: 0, note: e.message });
  }

  // 4. 真实交互：进入设计器加载节点类型
  console.log('\n--- 交互测试：进入设计器加载节点类型 ---');
  try {
    await page.goto(`${BASE}/spider/flow-designer/demo1`, { waitUntil: 'networkidle' });
    await humanDelay(2000, 3000);
    await shot(page, '11-flow-designer-loaded');

    const nodeTypes = await page.evaluate(async () => {
      const r = await fetch('http://localhost:19091/spider-api/spider/flows/node-types');
      const j = await r.json();
      return Object.keys(j?.data || {});
    });
    console.log(`  node-types API 返回 ${nodeTypes.length} 个节点: ${nodeTypes.join(', ')}`);
    results.push({
      name: 'interactive-node-types',
      url: '/spider/flows/node-types',
      status: nodeTypes.length === 10 ? 'PASS' : 'WARN',
      duration: 0,
      note: `${nodeTypes.length} handlers: ${nodeTypes.join(',')}`,
    });
  } catch (e: any) {
    console.log(`  ✗ ${e.message}`);
    results.push({ name: 'interactive-node-types', url: '/spider/flows/node-types', status: 'FAIL', duration: 0, note: e.message });
  }

  await browser.close();

  // 汇总
  console.log('\n=== 汇总 ===');
  const pass = results.filter((r) => r.status === 'PASS').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PASS: ${pass}  WARN: ${warn}  FAIL: ${fail}  TOTAL: ${results.length}`);

  if (consoleErrors.length > 0) {
    console.log(`\n--- Console Errors (${consoleErrors.length} pages) ---`);
    for (const c of consoleErrors) {
      console.log(`  ${c.url}: ${c.errs.slice(0, 3).join(' | ')}`);
    }
  }
  if (networkErrors.length > 0) {
    console.log(`\n--- Network Failures (${networkErrors.length} pages) ---`);
    for (const n of networkErrors) {
      for (const f of n.failures.slice(0, 3)) {
        console.log(`  ${n.url} → ${f.url} ${f.status || ''} ${f.err}`);
      }
    }
  }

  writeFileSync(`${SHOTS}\\report.json`, JSON.stringify({ results, consoleErrors, networkErrors }, null, 2));
  console.log(`\nScreenshots: ${SHOTS}`);
  console.log(`Report: ${SHOTS}\\report.json`);

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(2);
});
