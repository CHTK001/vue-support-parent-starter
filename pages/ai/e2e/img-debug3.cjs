const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const apiCalls = [];
  page.on('response', r => {
    if (r.url().includes('/api/') || r.url().includes('/v2/')) {
      apiCalls.push(r.status() + ' ' + r.url().substring(r.url().indexOf('5173') + 5));
    }
  });

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(6000);

  console.log('=== API calls ===');
  apiCalls.forEach(c => console.log('  ' + c));

  // Click each select and count options
  const selects = await page.$$('.arco-select');
  console.log('\n=== Selects: ' + selects.length + ' ===');
  for (let i = 0; i < selects.length; i++) {
    try {
      await selects[i].click({ force: true });
      await page.waitForTimeout(800);
      const opts = await page.$$('[class*="select-option"]');
      const optTexts = await Promise.all(opts.slice(0, 5).map(o => o.innerText()));
      console.log('  select[' + i + ']: ' + opts.length + ' options' + (opts.length ? ' -> ' + optTexts.join(', ') : ''));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) { console.log('  select[' + i + '] error: ' + e.message.substring(0, 60)); }
  }

  await browser.close();
})();