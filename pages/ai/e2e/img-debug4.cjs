const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  const consoleLogs = [];
  page.on('console', m => consoleLogs.push(m.type() + ': ' + m.text().substring(0, 200)));
  page.on('pageerror', e => consoleLogs.push('PAGEERR: ' + e.message.substring(0, 200)));

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(6000);

  // Inject debug hook into the page to inspect the httpRequest response
  const capResult = await page.evaluate(async () => {
    // Call the exact same request the component makes
    try {
      const r = await fetch('/v2/ai/models/capabilities');
      const contentType = r.headers.get('Content-Type');
      const text = await r.text();
      const json = JSON.parse(text);
      const unwrapped = (json && typeof json === 'object' && 'data' in json) ? json.data : json;
      return {
        contentType,
        hasData: json && typeof json === 'object' && 'data' in json,
        unwrappedKeys: Object.keys(unwrapped || {}),
        classify: unwrapped?.classify?.length,
        success: json.success
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('capabilities unwrap test:', JSON.stringify(capResult));

  // Check console for any catalog-related errors
  console.log('\nConsole (filtered):');
  consoleLogs.filter(l => l.includes('v2') || l.includes('catalog') || l.includes('capab') || l.includes('ERR')).forEach(l => console.log('  ' + l));

  await browser.close();
})();