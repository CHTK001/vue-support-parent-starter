const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text().substring(0, 200)));
  page.on('pageerror', e => logs.push('PAGEERR: ' + e.message.substring(0, 200)));

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Wait progressively and probe the select behavior at each point
  for (const waitMs of [3000, 6000, 12000]) {
    await page.waitForTimeout(waitMs);
    const sels = await page.$$('.arco-select');
    // Click the first select
    let res = null;
    if (sels.length > 0) {
      await sels[0].click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1000);
      res = await page.evaluate(() => ({
        popup: !!document.querySelector('.arco-select-popup, .arco-select-dropdown'),
        options: document.querySelectorAll('.arco-select-option').length,
      }));
      await page.keyboard.press('Escape').catch(() => {});
    } else {
      res = { noSelects: true };
    }
    console.log(`After ${waitMs}ms: selects=${sels.length} clickRes=${JSON.stringify(res)}`);
  }

  // Capture any console errors related to catalog/capabilities
  console.log('\nConsole errors:', logs.filter(l => l.toLowerCase().includes('error')).slice(0, 5));
  await browser.close();
})();