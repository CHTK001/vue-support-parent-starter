import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const allLogs = [];
const networkErrors = [];

page.on('console', msg => {
  allLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  allLogs.push(`[pageerror] ${err.message}\n${err.stack}`);
});
page.on('requestfailed', request => {
  networkErrors.push(`[requestfailed] ${request.url()} - ${request.failure()?.errorText}`);
});
page.on('response', response => {
  if (response.status() >= 400) {
    networkErrors.push(`[HTTP ${response.status()}] ${response.url()}`);
  }
});

console.log('=== Redis 页面详细调试 ===\n');

// 打开页面
console.log('打开 Redis 页面...');
await page.goto('http://127.0.0.1:8848/#/redis', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(10000);

// 检查页面 URL
console.log(`\n页面 URL: ${page.url()}`);
console.log(`页面标题: ${await page.title()}`);

// 检查路由
const currentRoute = await page.evaluate(() => {
  const hash = window.location.hash;
  const app = document.querySelector('#app');
  return {
    hash,
    appExists: !!app,
    appChildren: app ? app.children.length : 0,
    appInnerHTML: app ? app.innerHTML.substring(0, 500) : null
  };
});
console.log(`\n路由 hash: ${currentRoute.hash}`);
console.log(`#app 存在: ${currentRoute.appExists}`);
console.log(`#app 子元素数量: ${currentRoute.appChildren}`);
console.log(`#app innerHTML (前500字符):\n${currentRoute.appInnerHTML}`);

// 检查 body 内容
const bodyText = await page.evaluate(() => document.body.innerText);
console.log(`\nBody 文本长度: ${bodyText.length}`);
console.log(`Body 文本 (前500字符):\n${bodyText.substring(0, 500)}`);

// 检查所有控制台日志
console.log(`\n=== 所有控制台日志 (${allLogs.length}条) ===`);
allLogs.forEach((log, i) => {
  console.log(`${i + 1}. ${log.substring(0, 200)}`);
});

// 检查网络错误
console.log(`\n=== 网络错误 (${networkErrors.length}条) ===`);
networkErrors.forEach((err, i) => {
  console.log(`${i + 1}. ${err}`);
});

// 截图
await page.screenshot({ path: 'test-results/redis-debug/debug.png', fullPage: true });
console.log('\n截图已保存: test-results/redis-debug/debug.png');

await browser.close();
console.log('\n调试完成。');
