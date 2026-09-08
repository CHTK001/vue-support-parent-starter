const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', e.message.substring(0, 150)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().substring(0, 150)); });

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Check page loaded fully
  const hasRoot = await page.evaluate(() => !!document.getElementById('root')?.children.length);
  console.log('hasRoot children:', hasRoot);

  const selects = await page.$$('.arco-select');
  console.log('select count:', selects.length);

  if (selects.length > 0) {
    // Click the inner input/selector rather than the wrapper div
    await selects[0].evaluate(el => {
      const view = el.querySelector('.arco-select-view, .arco-select-view-selector');
      if (view) view.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({
      expanded: !!document.querySelector('.arco-select[aria-expanded="true"]'),
      popup: !!document.querySelector('.arco-select-popup, .arco-select-dropdown, [id*="arco-select-popup"]'),
      options: document.querySelectorAll('.arco-select-option').length,
      bodyChildCount: document.body.children.length,
    }));
    console.log('after synthetic click:', JSON.stringify(after));
  }

  await browser.close();
})();