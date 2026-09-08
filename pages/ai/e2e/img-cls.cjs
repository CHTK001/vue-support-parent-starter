const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  const info = await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('.arco-select'));
    return sels.map((s, i) => {
      const cs = getComputedStyle(s);
      return {
        idx: i,
        className: s.className,
        width: cs.width,
        minWidth: cs.minWidth,
        // Check if the parent row has width constraints
        parentCls: s.parentElement?.className?.substring(0, 60),
        parentWidth: s.parentElement ? getComputedStyle(s.parentElement).width : '',
        grandParentCls: s.parentElement?.parentElement?.className?.substring(0, 60),
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();