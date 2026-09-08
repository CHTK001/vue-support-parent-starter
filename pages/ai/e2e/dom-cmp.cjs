const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });

  for (const path of ['ocr', 'image-recognition']) {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/settings/' + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(8000);

    const sels = await page.$$('.arco-select');
    console.log('\n' + path.toUpperCase() + ': ' + sels.length + ' selects');
    if (sels.length > 0) {
      // Get the complete DOM of first select
      const html = await sels[0].evaluate(el => el.outerHTML.substring(0, 600));
      console.log('  First select DOM:', html);
      // Get its label (previous row text)
      const label = await sels[0].evaluate(el => {
        const row = el.closest('div');
        return row?.previousElementSibling?.textContent?.trim()?.substring(0, 30) || row?.textContent?.trim()?.substring(0, 30);
      });
      console.log('  Label near select:', label);
    }
    await page.close();
  }
  await browser.close();
})();