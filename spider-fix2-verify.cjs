// 验证 ReTable 操作列修复
const { chromium } = require('playwright');
const { writeFileSync, existsSync, mkdirSync } = require('node:fs');

const url = 'http://localhost:19092/spider/flow-list';
const shotPath = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\fix2-actions.png';
const reportPath = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\fix2-report.json';

async function main() {
  const report = { ok: false, step: 'init' };
  if (!existsSync('C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots')) {
    mkdirSync('C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots', { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const tableHTML = await page.locator('table.el-table__body').innerHTML();
    const cells = await page.locator('table.el-table__body tbody tr td:last-child').allInnerTexts();
    const buttons = await page.locator('table.el-table__body tbody tr td:last-child button').allInnerTexts();
    const bodyText = (await page.locator('body').innerText()).slice(0, 1500);

    report.tableHTMLLen = tableHTML.length;
    report.tableHTMLHead = tableHTML.slice(0, 500);
    report.cellTexts = cells;
    report.buttonTexts = buttons;
    report.bodyText = bodyText;

    report.screenshot = shotPath;
    await page.screenshot({ path: shotPath, fullPage: true });

    const hasMine = ['编排', '调试', '历史', '删除'].filter(t => buttons.some(b => b.includes(t)));
    report.foundButtons = hasMine;
    report.buttonCount = buttons.length;

    if (hasMine.length >= 3) {
      report.ok = true;
      report.step = 'PASS';
    } else {
      report.step = 'FAIL: buttons not rendered';
    }

    try {
      const debugBtn = page.getByRole('button', { name: '调试' }).first();
      if (await debugBtn.count() > 0) {
        await debugBtn.click();
        await page.waitForTimeout(6000);
        const dialogText = await page.locator('body').innerText();
        report.clickDebug = {
          clicked: true,
          hasExecutionLogsDialog: dialogText.includes('调试执行日志') || dialogText.includes('SUCCESS'),
          snippet: dialogText.slice(0, 800),
        };
        await page.screenshot({ path: 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\fix2-debug-clicked.png', fullPage: true });
      }
    } catch (e) {
      report.clickDebugError = String(e);
    }
  } catch (e) {
    report.error = String(e);
  } finally {
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    await browser.close();
    console.log(`[fix2] ${report.step}, ok=${report.ok}, buttons=${report.buttonCount}`);
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
