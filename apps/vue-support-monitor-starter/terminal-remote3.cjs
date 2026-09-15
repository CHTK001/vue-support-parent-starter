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
    if (text.includes('124.221') || text.includes('远程') || text.includes('Ubuntu')) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex >= 0) {
    console.log(`找到远程Ubuntu服务器，索引: ${targetIndex}`);
    await items.nth(targetIndex).click();
    console.log('等待连接15秒...');
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'test-results/terminal-remote-ubuntu-final.png', fullPage: true });
    console.log('截图已保存: test-results/terminal-remote-ubuntu-final.png');
    const bodyText = await page.locator('body').innerText();
    console.log('页面文本长度:', bodyText.length);
    console.log('包含login:', bodyText.toLowerCase().includes('login'));
    console.log('包含password:', bodyText.toLowerCase().includes('password'));
    console.log('包含124.221:', bodyText.includes('124.221'));
  } else {
    console.log('未找到远程Ubuntu服务器');
    await page.screenshot({ path: 'test-results/terminal-host-list-debug.png', fullPage: true });
  }
  await browser.close();
  console.log('完成!');
})();
