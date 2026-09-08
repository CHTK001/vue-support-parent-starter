const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });

  // Test OCR vs image-recognition in the SAME browser session
  for (const path of ['ocr', 'image-recognition']) {
    const page = await browser.newPage();
    const apiResp = {};
    page.on('response', r => {
      const u = r.url();
      if (u.includes('/v2/ai/models/capabilities') || u.includes('/v2/') && u.includes('/config')) {
        apiResp[u.substring(u.indexOf(':5173') + 6)] = r.status();
      }
    });

    await page.goto('http://127.0.0.1:5173/settings/' + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(8000);

    // Inspect the actual select options in DOM
    const selects = await page.$$('.arco-select');
    console.log('\n' + path.toUpperCase() + ': ' + selects.length + ' selects, api=' + JSON.stringify(apiResp));

    for (let i = 0; i < Math.min(selects.length, 3); i++) {
      await selects[i].click({ force: true });
      await page.waitForTimeout(1500);
      // Query ALL elements in the dropdown popup
      const popup = await page.evaluate(() => {
        const all = document.querySelectorAll('.arco-select-popup, .arco-select-dropdown, [class*="select-option"], [class*="Select-option"]');
        const list = [];
        all.forEach(el => {
          const txt = (el.textContent || '').trim().substring(0, 30);
          if (el.className && typeof el.className === 'string' && el.className.includes('option')) list.push(txt);
        });
        return list;
      });
      console.log('  select[' + i + '] options in DOM:', popup.length, popup.slice(0, 5));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
    await page.close();
  }
  await browser.close();
})();
