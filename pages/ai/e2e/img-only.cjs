const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && (m.text().includes('502') || m.text().includes('fatal') || m.text().includes('ECONN'))) errs.push(m.text().substring(0, 100)); });
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);
  const selects = await page.$$('.arco-select');
  console.log('selects:', selects.length, 'pageErrors:', errs.length);
  for (let i = 0; i < Math.min(selects.length, 6); i++) {
    try {
      await selects[i].click({ force: true });
      await page.waitForTimeout(1500);
      const opts = await page.$$('.arco-select-option');
      const texts = await Promise.all(opts.slice(0, 3).map(o => o.innerText().catch(() => '')));
      console.log('  [' + i + '] ' + opts.length + ' options' + (texts.length ? ' -> ' + texts.join(', ') : ''));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) { console.log('  [' + i + '] err: ' + e.message.substring(0, 50)); }
  }
  await browser.close();
})();