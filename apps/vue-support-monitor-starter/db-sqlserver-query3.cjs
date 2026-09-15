const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问数据库管理页面...');
  await page.goto('http://127.0.0.1:8848/#/db-manager', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('点击"新建查询"按钮...');
  await page.getByText('新建查询').first().click();
  await page.waitForTimeout(2000);
  console.log('重新选择SQL Server数据源...');
  const select = page.locator('.el-select');
  if (await select.count() > 0) {
    await select.first().click();
    await page.waitForTimeout(1000);
    const options = page.locator('.el-select-dropdown__item');
    const optCount = await options.count();
    console.log('数据源选项数量:', optCount);
    if (optCount >= 2) {
      await options.nth(1).click();
      await page.waitForTimeout(5000);
    }
  }
  console.log('点击SQL输入区域并输入查询...');
  await page.locator('body').click({ position: { x: 500, y: 320 } });
  await page.waitForTimeout(500);
  await page.keyboard.type('SELECT 1 AS test');
  await page.waitForTimeout(1000);
  console.log('点击执行按钮...');
  await page.getByText('执行').first().click();
  await page.waitForTimeout(15000);
  await page.screenshot({ path: 'test-results/db-sqlserver-query-result3.png', fullPage: true });
  console.log('查询结果截图已保存');
  const bodyText = await page.locator('body').innerText();
  console.log('页面文本长度:', bodyText.length);
  console.log('包含test:', bodyText.includes('test'));
  console.log('包含1:', bodyText.includes('1'));
  console.log('包含错误:', bodyText.includes('错误') || bodyText.includes('error') || bodyText.includes('Error'));
  console.log('包含失败:', bodyText.includes('失败') || bodyText.includes('failed'));
  console.log('包含超时:', bodyText.includes('超时') || bodyText.includes('timeout'));
  console.log('包含行:', bodyText.includes('行') || bodyText.includes('row'));
  await browser.close();
  console.log('完成!');
})();
