const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问远程控制页面...');
  await page.goto('http://127.0.0.1:8848/#/terminal', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const hostCount = await page.locator('.rail-item').count();
  console.log('主机列表项:', hostCount);
  if (hostCount >= 4) {
    console.log('点击第4台主机(远程Ubuntu服务器 124.221.230.112)...');
    await page.locator('.rail-item').nth(3).click();
    console.log('等待连接...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'test-results/terminal-remote-ubuntu.png', fullPage: true });
    console.log('远程连接截图已保存: test-results/terminal-remote-ubuntu.png');
    const bodyText = await page.locator('body').innerText();
    console.log('页面文本长度:', bodyText.length);
    console.log('包含login:', bodyText.toLowerCase().includes('login'));
    console.log('包含password:', bodyText.toLowerCase().includes('password'));
    console.log('包含ubuntu:', bodyText.toLowerCase().includes('ubuntu'));
    console.log('包含124.221:', bodyText.includes('124.221'));
  } else {
    console.log('主机数量不足，只有', hostCount, '台');
    await page.screenshot({ path: 'test-results/terminal-host-list.png', fullPage: true });
  }
  await browser.close();
  console.log('完成!');
})();
