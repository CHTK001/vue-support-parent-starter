const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问数据库管理页面...');
  await page.goto('http://127.0.0.1:8848/#/db-manager', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('点击数据源下拉框...');
  const select = page.locator('.el-select');
  if (await select.count() > 0) {
    await select.first().click();
    await page.waitForTimeout(1000);
    const options = page.locator('.el-select-dropdown__item');
    const optCount = await options.count();
    console.log('数据源选项数量:', optCount);
    if (optCount >= 2) {
      console.log('选择第2个数据源(SQL Server-ADONIX)...');
      await options.nth(1).click();
      await page.waitForTimeout(8000);
      await page.screenshot({ path: 'test-results/db-sqlserver-final.png', fullPage: true });
      console.log('SQL Server截图已保存');
      const bodyText = await page.locator('body').innerText();
      console.log('页面文本长度:', bodyText.length);
      console.log('包含master:', bodyText.includes('master'));
      console.log('包含model:', bodyText.includes('model'));
      console.log('包含msdb:', bodyText.includes('msdb'));
      console.log('包含tempdb:', bodyText.includes('tempdb'));
      console.log('包含表:', bodyText.includes('表') || bodyText.includes('table'));
      console.log('包含错误:', bodyText.includes('错误') || bodyText.includes('error') || bodyText.includes('Error'));
      console.log('包含连接失败:', bodyText.includes('连接失败') || bodyText.includes('failed') || bodyText.includes('Failed'));
      console.log('包含超时:', bodyText.includes('超时') || bodyText.includes('timeout'));
    }
  }
  await browser.close();
  console.log('完成!');
})();
