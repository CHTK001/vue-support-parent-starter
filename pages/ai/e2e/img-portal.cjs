const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Click first select and inspect EVERYTHING in body
  const sels = await page.$$('.arco-select');
  if (sels.length > 0) {
    await sels[0].click({ force: true });
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => {
      // Check body children that might be popups/portals
      const allDivs = Array.from(document.querySelectorAll('body > div'));
      const portalInfo = allDivs.map(d => ({
        cls: (d.className || '').substring(0, 80),
        childCount: d.children.length,
        hasOption: !!d.querySelector('[class*="option"]'),
        text: (d.textContent || '').substring(0, 50),
      })).filter(x => x.cls || x.hasOption);
      // Check for arco trigger container
      const triggers = document.querySelectorAll('[class*="arco-trigger"], [class*="arco-popup"], [class*="arco-select-popup"]');
      return {
        bodyDivs: portalInfo.slice(0, 10),
        triggerCount: triggers.length,
        triggerClasses: Array.from(triggers).map(t => t.className.substring(0, 60)),
      };
    });
    console.log('Body portal state:', JSON.stringify(state, null, 2));

    // Take screenshot
    await page.screenshot({ path: 'D:\\ch\\project\\imgrec-clicked.png' });
    console.log('Screenshot saved');
  }
  await browser.close();
})();