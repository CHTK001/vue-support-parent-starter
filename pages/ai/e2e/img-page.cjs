const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.substring(0, 150)));
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Page text:', text);
  console.log('Page errors:', errs.length ? errs.join('\n') : 'none');
  const selects = await page.$$('.arco-select');
  console.log('Selects:', selects.length);
  await page.screenshot({ path: 'D:\\ch\\project\\img-page.png' });
  await browser.close();
})();
