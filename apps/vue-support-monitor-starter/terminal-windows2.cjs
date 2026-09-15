const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问远程控制页面...');
  await page.goto('http://127.0.0.1:8848/#/terminal', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const items = await page.locator('.rail-item');
  let targetIndex = -1;
  for (let i = 0; i < await items.count(); i++) {
    const text = await items.nth(i).innerText();
    if (text.includes('192.168.200') || text.includes('Windows')) { targetIndex = i; break; }
  }
  if (targetIndex >= 0) {
    await items.nth(targetIndex).click();
    console.log('已点击Windows服务器，等待RDP连接40秒...');
    await page.waitForTimeout(40000);
    await page.screenshot({ path: 'test-results/terminal-windows-rdp2.png', fullPage: true });
    console.log('RDP截图已保存');
  }
  await browser.close();
  console.log('完成!');
})();
