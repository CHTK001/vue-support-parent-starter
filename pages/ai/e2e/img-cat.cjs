const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();

  // Track capabilities fetch and its response
  const capResponses = [];
  page.on('response', async r => {
    if (r.url().includes('/v2/ai/models/capabilities')) {
      let body = '';
      try { body = (await r.text()).substring(0, 100); } catch {}
      capResponses.push({ status: r.status(), url: r.url(), body });
    }
  });

  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  console.log('capabilities responses:', JSON.stringify(capResponses));

  // Check the actual httpBridge request base URL
  const bridgeInfo = await page.evaluate(() => {
    return {
      backendPort: window.__backendPort,
      hasLocalTrust: !!window.__nomiLocalTrust,
    };
  });
  console.log('bridge info:', JSON.stringify(bridgeInfo));

  // Now check if the selects have options by clicking each and checking dropdown
  const sels = await page.$$('.arco-select');
  for (let i = 0; i < sels.length; i++) {
    await sels[i].click({ force: true });
    await page.waitForTimeout(800);
    const opts = await page.$$('.arco-select-option');
    console.log('  select[' + i + '] -> ' + opts.length + ' options');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  await browser.close();
})();