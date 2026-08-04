import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SHOT_DIR = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots';
const EXECUTABLE = 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe';
const REPORT_PATH = join(SHOT_DIR, 'fix-report.json');
const SCREEN_1 = join(SHOT_DIR, 'fixed-actions.png');
const SCREEN_2 = join(SHOT_DIR, 'fixed-actions-debug-clicked.png');
const REQUIRED_LABELS = ['编排', '调试', '启用', '禁用', '历史', '删除'];

mkdirSync(SHOT_DIR, { recursive: true });

function failReport(issue: string, extra: Record<string, unknown> = {}) {
  const out = { ok: false, issue, ...extra };
  writeFileSync(REPORT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: EXECUTABLE,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();

  const network: { url: string; status: number }[] = [];
  page.on('response', (resp) => {
    const u = resp.url();
    if (u.includes('/spider/flows') || u.includes('19091')) {
      network.push({ url: u, status: resp.status() });
    }
  });
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`));

  try {
    await page.goto('http://localhost:19092/spider/flow-list', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  } catch (e: any) {
    await browser.close();
    failReport(`goto failed: ${e.message}`);
  }

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);

  let rowCount = await page.locator('table tbody tr').count();
  if (rowCount === 0) {
    console.log('[info] no rows yet, clicking 查询 to trigger reload...');
    const queryBtn = page.getByRole('button', { name: '查询' }).first();
    if (await queryBtn.count() > 0) {
      await queryBtn.click().catch(() => {});
      await page.waitForTimeout(2500);
    }
  }

  try {
    await page.waitForFunction(
      () => {
        const rows = document.querySelectorAll('table tbody tr');
        if (rows.length === 0) return false;
        return Array.from(rows).some((r) => {
          const t = (r.textContent || '').trim();
          return t.length > 0 && !/^\s*-\s*$/.test(t);
        });
      },
      { timeout: 15000 }
    );
  } catch (e: any) {
    const tableHTML = await page.locator('table').first().innerHTML().catch(() => '<no table>');
    await page.screenshot({ path: SCREEN_1, fullPage: true }).catch(() => {});
    await browser.close();
    failReport(`table rows not loaded: ${e.message}`, {
      networkSample: network.slice(-10),
      tableHTMLHead: tableHTML.slice(0, 600),
    });
  }

  await page.waitForTimeout(500);

  const tableHTML = await page.locator('table').first().innerHTML();
  await page.screenshot({ path: SCREEN_1, fullPage: true });

  const buttonCount = await page.locator('table button').count();

  const buttonsFound: string[] = [];
  for (const label of REQUIRED_LABELS) {
    const c = await page.locator(`table button:has-text("${label}")`).count();
    if (c > 0) buttonsFound.push(label);
  }

  const rows = page.locator('table tbody tr');
  rowCount = await rows.count();
  let demo1CellHTML = '';
  let demoLocalCellHTML = '';
  let demo1CellLen = 0;
  let demoLocalCellLen = 0;
  let demo1RowText = '';
  let demoLocalRowText = '';

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const text = ((await row.innerText()) || '').trim();
    if (!demo1CellLen && /^demo1(\s|$)/.test(text)) {
      const cells = row.locator('td');
      const cellCount = await cells.count();
      if (cellCount > 0) {
        const lastCell = cells.nth(cellCount - 1);
        demo1CellHTML = (await lastCell.innerHTML()) || '';
        demo1CellLen = demo1CellHTML.length;
        demo1RowText = text;
      }
    } else if (!demoLocalCellLen && /^demo_local(\s|$)/.test(text)) {
      const cells = row.locator('td');
      const cellCount = await cells.count();
      if (cellCount > 0) {
        const lastCell = cells.nth(cellCount - 1);
        demoLocalCellHTML = (await lastCell.innerHTML()) || '';
        demoLocalCellLen = demoLocalCellHTML.length;
        demoLocalRowText = text;
      }
    }
  }

  const actionsRendered =
    buttonCount > 0 &&
    demo1CellLen > 200 &&
    demo1CellHTML.includes('<button') &&
    buttonsFound.length >= 4;

  if (!actionsRendered) {
    await page.screenshot({ path: SCREEN_1, fullPage: true }).catch(() => {});
    await page.screenshot({ path: SCREEN_2, fullPage: true }).catch(() => {});
    await browser.close();
    failReport(
      `actions column still broken (rendered fallback '-'). ` +
        `buttonCount=${buttonCount}, demo1CellLen=${demo1CellLen}, ` +
        `demo1HasButton=${demo1CellHTML.includes('<button')}, ` +
        `buttonsFound=${JSON.stringify(buttonsFound)}, ` +
        `demo1RowText=${JSON.stringify(demo1RowText.slice(0, 120))}, ` +
        `demo1CellHead=${demo1CellHTML.slice(0, 300)}`,
      {
        networkSample: network.slice(-10),
        rowCount,
      }
    );
  }

  let clickDebugWorked = false;
  let debugClickError = '';
  let debugButtonUsedSelector = '';
  try {
    const debugBtn = page.getByRole('button', { name: '调试' }).first();
    await debugBtn.waitFor({ state: 'visible', timeout: 5000 });
    debugButtonUsedSelector = `getByRole('button',{name:'调试'}).first() -> ${await debugBtn.evaluate((el) => (el as HTMLElement).outerHTML.slice(0, 200))}`;
    await debugBtn.click({ timeout: 5000 });
    await page.waitForTimeout(5000);
    clickDebugWorked = true;
  } catch (e: any) {
    debugClickError = e.message;
  }

  await page.screenshot({ path: SCREEN_2, fullPage: true });

  const report = {
    actionsColumnRendered: true,
    buttonCount,
    buttonsFound,
    demo1RowInnerHTML: demo1CellHTML,
    demoLocalRowInnerHTML: demoLocalCellHTML,
    demo1CellLen,
    demoLocalCellLen,
    demo1RowText,
    demoLocalRowText,
    rowCount,
    clickDebugWorked,
    debugClickError: debugClickError || undefined,
    debugButtonUsedSelector,
    tableHTMLLength: tableHTML.length,
    networkCalls: network.slice(-15),
    ok: true,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.log(`[fatal] ${e.stack || e.message}`);
  failReport(`fatal: ${e.message}`);
});
