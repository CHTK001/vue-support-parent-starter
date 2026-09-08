const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text().substring(0, 200)));
  page.on('pageerror', e => logs.push('PAGEERR: ' + e.message.substring(0, 200)));

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Inspect the full config response for image-recognition
  const cfg = await page.evaluate(async () => {
    const r = await fetch('/v2/image-recognition/config');
    const j = await r.json();
    return j.data.map(f => ({ field: f.field, value: f.value, valueType: f.valueType, desc: f.description }));
  });
  console.log('Config items:');
  cfg.forEach(c => console.log(' ', c.field, '=', JSON.stringify(c.value), '[' + c.valueType + ']'));

  // Click first select and capture console
  const sels = await page.$$('.arco-select');
  if (sels.length > 0) {
    await sels[0].click();
    await page.waitForTimeout(1500);
    console.log('\nAfter click, new logs:');
    console.log(logs.filter(l => l.includes('ERR') || l.includes('Error')).join('\n') || 'none');
  }

  await browser.close();
})();