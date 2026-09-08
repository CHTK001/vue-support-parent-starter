const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });

  // Compare OCR vs image-recognition catalog loading
  for (const path of ['ocr', 'image-recognition']) {
    const page = await browser.newPage();
    const httpErrors = [];
    page.on('response', r => {
      if (r.status() >= 400 && (r.url().includes('/v2/') || r.url().includes('/api/'))) {
        httpErrors.push(r.status() + ' ' + r.url().substring(r.url().indexOf(':8787') + 6));
      }
    });
    await page.goto('http://127.0.0.1:5173/settings/' + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(6000);

    // Probe the modelCapabilities + catalog behavior by querying rendered DOM
    const info = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('.arco-select'));
      return selects.map((s, i) => {
        const optEls = s.querySelectorAll('.arco-select-option, [class*="option"]');
        const inputs = s.querySelectorAll('input');
        return {
          idx: i,
          value: s.getAttribute('aria-valuenow') || (inputs[0] ? inputs[0].value : ''),
          optionCount: optEls.length
        };
      });
    });
    console.log('\n' + path.toUpperCase() + ' selects: ' + JSON.stringify(info));

    // Click each model select and count options
    const selects = await page.$$('.arco-select');
    for (let i = 0; i < Math.min(selects.length, 6); i++) {
      try {
        await selects[i].click({ force: true });
        await page.waitForTimeout(1500);
        const opts = await page.$$('.arco-select-option');
        const firsts = await Promise.all(opts.slice(0, 3).map(o => o.innerText().catch(() => '')));
        console.log('  select[' + i + '] -> ' + opts.length + ' options' + (opts.length ? ': ' + firsts.join(', ') : ''));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } catch (e) { console.log('  select[' + i + '] err: ' + e.message.substring(0, 50)); }
    }
    console.log('  HTTP errors: ' + (httpErrors.length ? httpErrors.join('; ') : 'none'));
    await page.close();
  }

  await browser.close();
})();