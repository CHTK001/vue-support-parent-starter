const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => { if (m.type() === 'error') logs.push('ERR: ' + m.text().substring(0, 150)); });
  page.on('pageerror', e => logs.push('PAGEERR: ' + e.message.substring(0, 150)));

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(6000);

  // Check the capabilities API directly from the page
  const capResp = await page.evaluate(async () => {
    const r = await fetch('/v2/ai/models/capabilities');
    const j = await r.json();
    return { status: r.status, hasClassify: !!j.data?.classify, classifyLen: j.data?.classify?.length, keys: Object.keys(j.data || {}) };
  });
  console.log('capabilities API:', JSON.stringify(capResp));

  // Check config API
  const cfgResp = await page.evaluate(async () => {
    const r = await fetch('/v2/image-recognition/config');
    const j = await r.json();
    return { status: r.status, fields: (j.data || []).map(f => f.field) };
  });
  console.log('config API:', JSON.stringify(cfgResp));

  // Inspect what the page actually rendered
  const rendered = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.arco-select, input[type="text"], input[type="number"]'));
    return rows.map(el => ({
      tag: el.tagName,
      cls: el.className.substring(0, 60),
      val: el.value ?? '',
      ph: el.getAttribute('placeholder') ?? ''
    }));
  });
  console.log('rendered controls:', JSON.stringify(rendered, null, 2));

  console.log('console errors:', logs.length ? logs : 'none');
  await browser.close();
})();
