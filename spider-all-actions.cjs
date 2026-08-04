// 全表遍历所有 ReTable 操作列
const { chromium } = require('playwright');
const { writeFileSync, existsSync, mkdirSync } = require('node:fs');

const pages = [
  { name: 'flow-list', url: 'http://localhost:19092/spider/flow-list', expectActions: ['编排', '调试', '禁用', '历史', '删除'] },
  { name: 'definitions', url: 'http://localhost:19092/spider/definitions', expectActions: ['编辑', '删除', '启用', '禁用'] },
  { name: 'data-records', url: 'http://localhost:19092/spider/data-records', expectActions: null },
  { name: 'executions', url: 'http://localhost:19092/spider/executions', expectActions: null },
];

const shotDir = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots';
const reportPath = shotDir + '\\all-actions-report.json';

async function main() {
  if (!existsSync(shotDir)) mkdirSync(shotDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    headless: true,
  });

  const report = { pages: {}, summary: { PASS: 0, FAIL: 0 } };

  for (const p of pages) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2500);

      const bodyText = (await page.locator('body').innerText()).slice(0, 1500);
      let buttonTexts = [];
      try {
        buttonTexts = await page.locator('table.el-table__body tbody tr td:last-child button').allInnerTexts();
        if (buttonTexts.length === 0) {
          buttonTexts = await page.locator('table tbody tr td:last-child button').allInnerTexts();
        }
      } catch (e) {}

      const pageResult = {
        bodyText: bodyText.slice(0, 800),
        buttonTexts,
        buttonCount: buttonTexts.length,
      };

      if (p.expectActions) {
        const found = p.expectActions.filter(t => buttonTexts.some(b => b.includes(t)));
        pageResult.foundExpected = found;
        pageResult.ok = found.length >= 2;
      } else {
        pageResult.ok = true;
      }

      await page.screenshot({ path: `${shotDir}\\all-${p.name}.png`, fullPage: true });
      report.pages[p.name] = pageResult;
      if (pageResult.ok) report.summary.PASS++; else report.summary.FAIL++;
    } catch (e) {
      report.pages[p.name] = { error: String(e), ok: false };
      report.summary.FAIL++;
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`[all-actions] PASS=${report.summary.PASS} FAIL=${report.summary.FAIL}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
