const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问远程控制页面...');
  await page.goto('http://127.0.0.1:8848/#/terminal', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const items = await page.locator('.rail-item');
  const count = await items.count();
  console.log('主机总数:', count);
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).innerText();
    console.log(`  [${i}] ${text.replace(/\n/g, ' | ')}`);
  }
  let targetIndex = -1;
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).innerText();
    if (text.includes('192.168.200') || text.includes('Windows') || text.includes('RDP')) {
      targetIndex = i;
      console.log(`找到Windows服务器，索引: ${i}`);
      break;
    }
  }
  if (targetIndex >= 0) {
    await items.nth(targetIndex).click();
    console.log('已点击Windows服务器，等待RDP连接25秒...');
    await page.waitForTimeout(25000);
    await page.screenshot({ path: 'test-results/terminal-windows-rdp.png', fullPage: true });
    console.log('RDP截图已保存: test-results/terminal-windows-rdp.png');
    const bodyText = await page.locator('body').innerText();
    console.log('页面文本长度:', bodyText.length);
    console.log('包含Windows:', bodyText.includes('Windows'));
    console.log('包含administrator:', bodyText.includes('administrator'));
    console.log('包含RDP:', bodyText.includes('RDP'));
  } else {
    console.log('未找到Windows服务器');
  }
  await browser.close();
  console.log('完成!');
})();
