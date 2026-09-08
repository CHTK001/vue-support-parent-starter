const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  
  for (const path of ['ocr', 'image-recognition']) {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/settings/' + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(8000);
    
    // 1. Check what httpRequest actually receives for capabilities
    const cap = await page.evaluate(async () => {
      const r = await fetch('/v2/ai/models/capabilities');
      const j = await r.json();
      const d = j.data || j;
      return {
        status: r.status,
        hasClassify: !!d.classify,
        classifyCount: d.classify?.length || 0,
        hasImageDetect: !!d['image-detect'],
        imageDetectCount: d['image-detect']?.length || 0,
      };
    });
    console.log(path + ' capabilities:', JSON.stringify(cap));

    // 2. Inspect the select boxes and computed widths
    const sels = await page.$$('.arco-select');
    const boxInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.arco-select')).slice(0, 2).map((s, i) => {
        const r = s.getBoundingClientRect();
        return { i, x: r.x, y: r.y, w: r.width, h: r.height };
      });
    });
    console.log(path + ' select boxes:', JSON.stringify(boxInfo));

    // 3. Try clicking first select and see if dropdown opens
    if (sels.length > 0) {
      await sels[0].click({ force: true });
      await page.waitForTimeout(1200);
      const state = await page.evaluate(() => ({
        popup: !!document.querySelector('.arco-select-popup, .arco-select-dropdown'),
        options: document.querySelectorAll('.arco-select-option').length,
        expanded: document.querySelector('.arco-select[aria-expanded="true"]') !== null,
      }));
      console.log(path + ' after click:', JSON.stringify(state));
      await page.keyboard.press('Escape');
    }
    await page.close();
  }
  
  await browser.close();
  console.log('DONE');
})();