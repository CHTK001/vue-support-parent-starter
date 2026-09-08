const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();

  // Compare OCR vs image-recognition select click behavior
  for (const path of ['ocr', 'image-recognition']) {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/settings/' + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(8000);

    const selects = await page.$$('.arco-select');
    console.log('\n' + path.toUpperCase() + ': ' + selects.length + ' selects');

    // Check first select's ancestor chain for disabled/opacity wrappers
    const ancestorInfo = await page.evaluate(() => {
      const s = document.querySelector('.arco-select');
      const chain = [];
      let el = s;
      while (el && el !== document.body) {
        const cls = typeof el.className === 'string' ? el.className : '';
        if (cls.includes('opacity') || cls.includes('pointer-events-none') || cls.includes('disabled')) {
          chain.push(cls.substring(0, 80));
        }
        el = el.parentElement;
      }
      const styles = s ? getComputedStyle(s) : null;
      return {
        pointerEvents: styles?.pointerEvents,
        opacity: styles?.opacity,
        display: styles?.display,
        disabledAncestors: chain,
      };
    });
    console.log('  first select styles:', JSON.stringify(ancestorInfo));

    // Try clicking with normal click and check dropdown
    if (selects.length > 0) {
      await selects[0].click();
      await page.waitForTimeout(1200);
      const dd = await page.evaluate(() => {
        return {
          hasDropdown: !!document.querySelector('.arco-select-dropdown, .arco-trigger'),
          options: document.querySelectorAll('.arco-select-option').length,
          activeEl: document.activeElement ? document.activeElement.className.substring(0, 60) : 'none',
        };
      });
      console.log('  after click:', JSON.stringify(dd));
    }
    await page.close();
  }
  await browser.close();
})();