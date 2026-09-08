const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if(m.type()==='error') errors.push(m.text().substring(0,150)); });

  // Test OCR first for comparison
  await page.goto('http://127.0.0.1:5173/settings/ocr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);
  const s1 = await page.$$('.arco-select');
  if (s1.length > 0) {
    await s1[0].click();
    await page.waitForTimeout(2000);
    const opts1 = await page.$$('.arco-select-option');
    console.log('OCR first select options:', opts1.length);
    if (opts1.length > 0) console.log('  First 3:', await Promise.all(opts1.slice(0,3).map(o=>o.innerText())));
    await page.keyboard.press('Escape');
  }

  // Now test image-recognition
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Check config response
  const cfgRes = await page.evaluate(async () => {
    const r = await fetch('/v2/image-recognition/config');
    const j = await r.json();
    return { status: r.status, fieldCount: j.data?.length || 0, fields: j.data?.map(f => f.field) || [] };
  });
  console.log('Config response:', JSON.stringify(cfgRes));

  // Click first select
  const s2 = await page.$$('.arco-select');
  console.log('Selects found:', s2.length);
  if (s2.length > 0) {
    await s2[0].click();
    await page.waitForTimeout(2000);
    const opts2 = await page.$$('.arco-select-option');
    console.log('First select options:', opts2.length);
    if (opts2.length > 0) console.log('  First 3:', await Promise.all(opts2.slice(0,3).map(o=>o.innerText())));
    await page.keyboard.press('Escape');
  }

  console.log('Console errors:', errors.filter(e => e.includes('502') || e.includes('error') || e.includes('v2')).length);
  await browser.close();
})();
