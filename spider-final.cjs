// 综合验证
const { chromium } = require('playwright');
const { writeFileSync, existsSync, mkdirSync } = require('node:fs');

async function main() {
  if (!existsSync('C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots')) {
    mkdirSync('C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots', { recursive: true });
  }
  const report = { ok: false, issues: [] };
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const networkErrors = [];
  const pageErrors = [];
  const vueWarns = [];
  const fontErrors = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') consoleErrors.push(text);
    if (type === 'warning' && /Vue warn|Failed to resolve|Plugin has already/.test(text)) vueWarns.push(text);
    if (/Failed to decode|KoiFont/.test(text)) fontErrors.push(text);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) networkErrors.push({ url: res.url(), status: res.status() });
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  try {
    // 验证 1: 流程列表（按钮渲染）
    await page.goto('http://localhost:19092/spider/flow-list', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const flowButtons = await page.locator('table.el-table__body tbody tr td:last-child button').count();
    report.flowListButtons = flowButtons;

    // 验证 2: 爬虫定义（按钮渲染）
    await page.goto('http://localhost:19092/spider/definitions', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const defButtons = await page.locator('table.el-table__body tbody tr td:last-child button').count();
    report.definitionsButtons = defButtons;

    // 验证 3: KoiFont 加载
    const koiReq = await page.evaluate(async () => {
      try {
        const r = await fetch('/assets/fonts/KoiFont.woff2');
        return { status: r.status, type: r.headers.get('content-type') };
      } catch (e) {
        return { error: String(e) };
      }
    });
    report.koiFont = koiReq;

    // 验证 4: 流程设计器（svg 数量）
    await page.goto('http://localhost:19092/spider/flow-designer/demo1', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const svgCount = await page.locator('svg').count();
    report.flowDesignerSvgs = svgCount;

    // 验证 5: ReTable 虚拟视图 warn
    report.consoleErrors = consoleErrors.length;
    report.consoleErrorSamples = consoleErrors.slice(0, 5);
    report.networkErrors = networkErrors.length;
    report.networkErrorSamples = networkErrors.slice(0, 5);
    report.pageErrors = pageErrors.length;
    report.vueWarns = vueWarns.length;
    report.vueWarnSamples = vueWarns.slice(0, 5);
    report.fontErrors = fontErrors.length;
    report.fontErrorSamples = fontErrors.slice(0, 5);

    if (flowButtons >= 10 && defButtons >= 4 && koiReq.type?.includes('font/woff2') && svgCount > 0) {
      report.ok = true;
    }
  } catch (e) {
    report.error = String(e);
  } finally {
    writeFileSync('C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\final-report.json', JSON.stringify(report, null, 2), 'utf-8');
    await browser.close();
    console.log(`[final] ok=${report.ok} flowBtns=${report.flowListButtons} defBtns=${report.definitionsButtons} koi=${report.koiFont?.type} svg=${report.flowDesignerSvgs} err=${report.consoleErrors} netErr=${report.networkErrors} pageErr=${report.pageErrors} vueWarn=${report.vueWarns} fontErr=${report.fontErrors}`);
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
