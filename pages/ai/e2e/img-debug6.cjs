const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text().substring(0, 120)));
  page.on('pageerror', e => logs.push('PAGEERR: ' + e.message.substring(0, 150)));

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // After load, check the rendered select's inner HTML to see if options exist
  const selectHtml = await page.evaluate(() => {
    const sels = document.querySelectorAll('.arco-select');
    const first = sels[0];
    return {
      count: sels.length,
      firstHTML: first ? first.innerHTML.substring(0, 500) : 'none',
      allInputs: Array.from(document.querySelectorAll('.arco-select input')).map(i => i.value),
    };
  });
  console.log('Select innerHTML:', JSON.stringify(selectHtml, null, 2));

  // Click first select and inspect the body-level dropdown
  const sel = await page.$$('.arco-select');
  if (sel.length > 0) {
    await sel[0].click({ force: true });
    await page.waitForTimeout(2000);
    const bodyState = await page.evaluate(() => {
      // Look for arco popup / dropdown at body level
      const popups = document.querySelectorAll('.arco-select-popup, .arco-trigger-popup, [class*="dropdown"]');
      const opts = document.querySelectorAll('.arco-select-option');
      return {
        popupCount: popups.length,
        popupClass: Array.from(popups).slice(0, 3).map(p => p.className.substring(0, 80)),
        optionCount: opts.length,
        optionTexts: Array.from(opts).slice(0, 5).map(o => o.textContent?.trim()),
        activeEl: document.activeElement?.className?.substring(0, 60),
      };
    });
    console.log('After click:', JSON.stringify(bodyState, null, 2));
  }

  console.log('Console logs:', logs.length ? logs.filter(l => l.includes('ERR')).slice(0, 10) : 'none');
  await browser.close();
})();