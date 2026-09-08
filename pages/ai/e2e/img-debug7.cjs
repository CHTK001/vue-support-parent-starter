const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Inspect what the httpRequest returns to setCatalog - replicate exactly
  const catalogResult = await page.evaluate(async () => {
    // httpBridge getBaseUrl in non-webui mode = http://127.0.0.1:8787 (because __backendPort injected)
    const backendPort = window.__backendPort;
    const url = backendPort ? `http://127.0.0.1:${backendPort}/v2/ai/models/capabilities` : '/v2/ai/models/capabilities';
    const r = await fetch(url, { cache: 'no-store' });
    const contentType = r.headers.get('Content-Type');
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = null; }
    // httpBridge unwrap
    const data = (json && typeof json === 'object' && 'data' in json) ? json.data : json;
    return {
      backendPort,
      url,
      status: r.status,
      contentType,
      textLen: text.length,
      isObj: !!data && typeof data === 'object',
      keys: data && typeof data === 'object' ? Object.keys(data) : null,
      classifyLen: data?.classify?.length,
    };
  });
  console.log('Catalog via absolute URL:', JSON.stringify(catalogResult, null, 2));

  // Now check the actual arco select dropdown behavior with a normal click
  const select0 = await page.$('.arco-select');
  if (select0) {
    await select0.click();
    await page.waitForTimeout(1000);
    const dropdown = await page.evaluate(() => {
      const dd = document.querySelector('.arco-select-dropdown, .arco-trigger-position-bl');
      const options = document.querySelectorAll('.arco-select-option');
      return {
        hasDropdown: !!dd,
        dropdownClass: dd ? dd.className.substring(0, 80) : null,
        optionCount: options.length,
      };
    });
    console.log('After normal click:', JSON.stringify(dropdown));
  }

  await browser.close();
})();