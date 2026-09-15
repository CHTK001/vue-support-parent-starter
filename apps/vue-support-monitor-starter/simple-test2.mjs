import { chromium } from 'playwright';

console.log('启动浏览器...');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text().substring(0, 300)}`);
});
page.on('pageerror', err => errors.push(`PAGEERROR: ${err.message.substring(0, 300)}`));

console.log('访问主机资产页面...');
try {
  await page.goto('http://127.0.0.1:8848/#/assets', { timeout: 30000, waitUntil: 'commit' });
  console.log('页面已提交，等待30秒渲染...');
  
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(5000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log(`第${(i+1)*5}秒: 文本长度=${bodyText.length}`);
    if (bodyText.length > 100) {
      console.log('页面已渲染内容！');
      break;
    }
  }
  
  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log(`\n最终页面文本长度: ${bodyText.length}`);
  if (bodyText.length > 0) {
    console.log(`页面文本前300字: ${bodyText.substring(0, 300)}`);
  }
  
  console.log(`\n控制台错误数: ${errors.length}`);
  errors.slice(0, 5).forEach(e => console.log(`  ${e}`));
  
  await page.screenshot({ path: 'D:/ch/project/artifacts/simple-test-assets2.png' });
  console.log('\n截图已保存');
} catch (e) {
  console.log(`错误: ${e.message}`);
  console.log(`控制台错误: ${errors.length}`);
  errors.slice(0, 5).forEach(e => console.log(`  ${e}`));
}

await browser.close();
console.log('完成');
