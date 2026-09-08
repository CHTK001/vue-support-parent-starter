const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const allLogs = [];
  page.on('console', m => allLogs.push(m.type() + ': ' + m.text().substring(0, 200)));
  page.on('pageerror', e => allLogs.push('PAGEERR: ' + e.message.substring(0, 300)));

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Now inspect the select elements and their rendered option children
  const detail = await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('.arco-select'));
    return sels.map((s, i) => {
      // Count actual Option elements inside
      const options = s.querySelectorAll('.arco-select-option');
      return {
        idx: i,
        viewText: s.querySelector('.arco-select-view-value')?.textContent?.trim() || '',
        childOptionCount: options.length,
        innerHTMLStart: s.innerHTML.substring(0, 120),
      };
    });
  });
  console.log('Select details:', JSON.stringify(detail, null, 2));

  console.log('\nAll console (non-404):', allLogs.filter(l => !l.includes('404')).slice(0, 20));

  await browser.close();
})();