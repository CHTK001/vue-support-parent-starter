const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);
  
  // Screenshot before clicking
  await page.screenshot({ path: 'D:\\ch\\project\\img-before.png' });
  
  // Check all selects and their rendered state
  const selectInfo = await page.evaluate(() => {
    const selects = document.querySelectorAll('.arco-select');
    return Array.from(selects).map((s, i) => {
      // Check the text content and attributes
      const input = s.querySelector('input');
      const value = input ? input.value : '';
      const text = s.textContent?.trim() || '';
      // Check if the select is in an opacity container
      const parent = s.closest('[class*="opacity"]');
      const disabled = parent ? parent.className : '';
      // Get the field name from the previous sibling or label
      const row = s.closest('[class*="divide"]');
      const label = row ? row.querySelector('[class*="text-t"]')?.textContent?.trim() : '';
      return { idx: i, value, text: text.substring(0, 30), disabled: disabled.substring(0, 50), label: label?.substring(0, 30) };
    });
  });
  console.log('Select info:', JSON.stringify(selectInfo, null, 2));
  
  // Click first select with longer wait
  const selects = await page.$$('.arco-select');
  if (selects.length > 0) {
    await selects[0].click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'D:\\ch\\project\\img-after-click.png' });
    
    // Check ALL elements with 'option' in class
    const optionEls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="option"], [class*="Option"]')).map(el => ({
        tag: el.tagName,
        cls: el.className.substring(0, 60),
        text: el.textContent?.trim().substring(0, 30),
        visible: el.offsetParent !== null,
        display: getComputedStyle(el).display,
      }));
    });
    console.log('All option-like elements:', JSON.stringify(optionEls, null, 2));
  }
  
  await browser.close();
})();
