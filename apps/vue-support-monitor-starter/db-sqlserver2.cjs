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
    for (let i = 0; i < optCount; i++) {
      const text = await options.nth(i).innerText();
      console.log(`  [${i}] ${text}`);
    }
    let sqlIndex = -1;
    for (let i = 0; i < optCount; i++) {
      const text = await options.nth(i).innerText();
      if (text.includes('SQL') || text.includes('ADONIX') || text.includes('192.168.200')) {
        sqlIndex = i;
        break;
      }
    }
    if (sqlIndex >= 0) {
      console.log(`选择SQL Server数据源，索引: ${sqlIndex}`);
      await options.nth(sqlIndex).click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'test-results/db-sqlserver-selected.png', fullPage: true });
      console.log('选择后截图已保存');
      const bodyText = await page.locator('body').innerText();
      console.log('包含master:', bodyText.includes('master'));
      console.log('包含表:', bodyText.includes('表') || bodyText.includes('table'));
      console.log('包含错误:', bodyText.includes('错误') || bodyText.includes('error'));
      console.log('包含连接失败:', bodyText.includes('连接失败') || bodyText.includes('failed'));
    } else {
      console.log('未找到SQL Server数据源');
      await page.screenshot({ path: 'test-results/db-datasource-options.png', fullPage: true });
    }
  } else {
    console.log('未找到数据源下拉框');
  }
  await browser.close();
  console.log('完成!');
})();
