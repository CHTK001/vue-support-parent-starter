const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER, viewport: { width: 1920, height: 1080 } });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  const info = await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('.arco-select'));
    return sels.map((s, i) => {
      const r = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      return {
        idx: i,
        x: r.x, y: r.y, w: r.width, h: r.height,
        clsWidth: cs.width,
        className: s.className.substring(0, 60),
      };
    });
  });
  console.log('Viewport-relative boxes:', JSON.stringify(info, null, 2));

  // Also check viewport size
  const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  console.log('Viewport:', JSON.stringify(vp));
  await browser.close();
})();