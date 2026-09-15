import { chromium } from 'playwright';

console.log('启动浏览器...');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();

console.log('访问主机资产页面...');
try {
  await page.goto('http://127.0.0.1:8848/#/assets', { timeout: 30000, waitUntil: 'commit' });
  console.log('页面已提交，等待渲染...');
  await page.waitForTimeout(10000);
  
  const bodyText = await page.locator('body').innerText();
  console.log(`页面文本长度: ${bodyText.length}`);
  console.log(`页面文本前200字: ${bodyText.substring(0, 200)}`);
  
  await page.screenshot({ path: 'D:/ch/project/artifacts/simple-test-assets.png' });
  console.log('截图已保存');
} catch (e) {
  console.log(`错误: ${e.message}`);
}

await browser.close();
console.log('完成');
