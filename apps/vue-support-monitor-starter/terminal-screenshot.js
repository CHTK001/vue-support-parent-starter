const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问远程控制页面...');
  await page.goto('http://127.0.0.1:8848/#/terminal', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const title = await page.title();
  console.log('页面标题:', title);
  const hasLeftPanel = await page.locator('.rail').count();
  const hasHostList = await page.locator('.rail-item').count();
  const hasEmptyTip = await page.locator('.remote-empty').count();
  console.log('左侧资源条:', hasLeftPanel > 0 ? '存在' : '不存在');
  console.log('主机列表项:', hasHostList);
  console.log('空状态提示:', hasEmptyTip > 0 ? '存在' : '不存在');
  await page.screenshot({ path: 'test-results/terminal-page.png', fullPage: true });
  console.log('截图已保存: test-results/terminal-page.png');
  if (hasHostList > 0) {
    console.log('点击第一台主机...');
    await page.locator('.rail-item').first().click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/terminal-connected.png', fullPage: true });
    console.log('连接后截图已保存: test-results/terminal-connected.png');
  }
  await browser.close();
  console.log('完成!');
})();
