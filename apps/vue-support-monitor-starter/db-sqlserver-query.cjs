const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('访问数据库管理页面...');
  await page.goto('http://127.0.0.1:8848/#/db-manager', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('选择SQL Server数据源...');
  const select = page.locator('.el-select');
  if (await select.count() > 0) {
    await select.first().click();
    await page.waitForTimeout(1000);
    const options = page.locator('.el-select-dropdown__item');
    if (await options.count() >= 2) {
      await options.nth(1).click();
      await page.waitForTimeout(5000);
    }
  }
  console.log('点击"新建查询"按钮...');
  const newQueryBtn = page.getByText('新建查询');
  if (await newQueryBtn.count() > 0) {
    await newQueryBtn.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/db-sqlserver-query-dialog.png', fullPage: true });
    console.log('新建查询弹窗截图已保存');
    console.log('输入SQL查询: SELECT @@VERSION...');
    const textarea = page.locator('textarea, .el-textarea__inner, input[type="text"]');
    if (await textarea.count() > 0) {
      await textarea.first().fill('SELECT @@VERSION');
      await page.waitForTimeout(1000);
      console.log('点击执行按钮...');
      const execBtn = page.getByText('执行', { exact: true });
      if (await execBtn.count() > 0) {
        await execBtn.first().click();
      } else {
        const runBtn = page.getByText('运行');
        if (await runBtn.count() > 0) await runBtn.first().click();
      }
      await page.waitForTimeout(8000);
      await page.screenshot({ path: 'test-results/db-sqlserver-query-result.png', fullPage: true });
      console.log('查询结果截图已保存');
      const bodyText = await page.locator('body').innerText();
      console.log('包含Microsoft:', bodyText.includes('Microsoft'));
      console.log('包含SQL Server:', bodyText.includes('SQL Server'));
      console.log('包含错误:', bodyText.includes('错误') || bodyText.includes('error') || bodyText.includes('Error'));
      console.log('包含失败:', bodyText.includes('失败') || bodyText.includes('failed'));
    }
  } else {
    console.log('未找到"新建查询"按钮');
  }
  await browser.close();
  console.log('完成!');
})();
