const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(6000);
  const selects = await page.$$('.arco-select');
  console.log('selects:', selects.length);
  for (let i = 0; i < selects.length; i++) {
    try {
      await selects[i].click({ force: true });
      await page.waitForTimeout(800);
      const opts = await page.$$('[class*="select-option"]');
      console.log('  select[' + i + '] options:', opts.length);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) { console.log('  select[' + i + '] error:', e.message.substring(0, 60)); }
  }
  await browser.close();
})();
