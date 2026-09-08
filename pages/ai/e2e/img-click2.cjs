const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Click first select and check what element receives the click
  const sels = await page.$$('.arco-select');
  if (sels.length > 0) {
    const box = await sels[0].boundingBox();
    console.log('select[0] box:', JSON.stringify(box));
    if (box) {
      // Check what element is at the center point
      const hitTest = await page.evaluate((x, y) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, cls: el.className?.substring(0, 80), role: el.getAttribute('role') } : null;
      }, box.x + box.width / 2, box.y + box.height / 2);
      console.log('element at click point:', JSON.stringify(hitTest));
    }

    // Click via keyboard focus + Enter (more reliable for headless)
    await sels[0].focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    const afterEnter = await page.evaluate(() => ({
      expanded: document.querySelector('.arco-select[aria-expanded="true"]') ? true : false,
      popup: !!document.querySelector('.arco-select-popup, .arco-select-dropdown'),
      options: document.querySelectorAll('.arco-select-option').length,
    }));
    console.log('After Enter key:', JSON.stringify(afterEnter));
  }

  await browser.close();
})();