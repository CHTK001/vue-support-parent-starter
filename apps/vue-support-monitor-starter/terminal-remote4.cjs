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
  let targetIndex = -1;
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).innerText();
    if (text.includes('124.221') || text.includes('Ubuntu') || text.includes('远程')) {
      targetIndex = i;
      console.log(`找到远程Ubuntu服务器，索引: ${i}, 文本: ${text.replace(/\n/g, ' | ')}`);
      break;
    }
  }
  if (targetIndex >= 0) {
    await items.nth(targetIndex).click();
    console.log('已点击远程Ubuntu服务器，等待连接20秒...');
    await page.waitForTimeout(20000);
    await page.screenshot({ path: 'test-results/terminal-remote-logged-in.png', fullPage: true });
    console.log('截图已保存: test-results/terminal-remote-logged-in.png');
    const bodyText = await page.locator('body').innerText();
    console.log('页面文本长度:', bodyText.length);
    console.log('包含login:', bodyText.toLowerCase().includes('login'));
    console.log('包含password:', bodyText.toLowerCase().includes('password'));
    console.log('包含ubuntu@:', bodyText.includes('ubuntu@'));
    console.log('包含$:', bodyText.includes('$'));
    console.log('包含#:', bodyText.includes('#'));
  }
  await browser.close();
  console.log('完成!');
})();
