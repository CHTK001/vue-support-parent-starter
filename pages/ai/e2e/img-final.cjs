const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  
  // Navigate and wait
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);
  
  // Check catalog loading
  const catalogInfo = await page.evaluate(async () => {
    const resp = await fetch('/v2/ai/models/capabilities');
    const json = await resp.json();
    const data = json?.data || json;
    return {
      status: resp.status,
      hasClassify: !!data?.classify,
      classifyLen: data?.classify?.length || 0,
      allKeys: Object.keys(data || {}),
    };
  });
  console.log('Catalog:', JSON.stringify(catalogInfo));
  
  // Check rendered selects
  const selects = await page.$$('.arco-select');
  console.log('Selects:', selects.length);
  
  // Click first select
  if (selects.length > 0) {
    await selects[0].click({ force: true });
    await page.waitForTimeout(2000);  // wait longer
    const opts = await page.$$('.arco-select-option');
    console.log('First select options:', opts.length);
    if (opts.length > 0) {
      const texts = await Promise.all(opts.slice(0, 5).map(o => o.innerText()));
      console.log('  First 5:', texts);
    }
    await page.keyboard.press('Escape');
  }
  
  // Check each select
  for (let i = 0; i < Math.min(selects.length, 6); i++) {
    try {
      await selects[i].click({ force: true });
      await page.waitForTimeout(1500);
      const opts = await page.$$('.arco-select-option');
      console.log('  [' + i + '] ' + opts.length + ' options');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) { console.log('  [' + i + '] err: ' + e.message.substring(0, 50)); }
  }
  
  await browser.close();
})();
