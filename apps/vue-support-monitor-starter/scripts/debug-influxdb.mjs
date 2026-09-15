import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(`[console.error] ${msg.text()}`);
  }
});
page.on('pageerror', err => {
  errors.push(`[pageerror] ${err.message}`);
});

console.log('正在打开 InfluxDB 管理页面...');
await page.goto('http://127.0.0.1:8848/#/influxdb', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(15000);

console.log('\n=== 页面标题 ===');
console.log(await page.title());

console.log('\n=== 页面 URL ===');
console.log(page.url());

console.log('\n=== 控制台错误 ===');
if (errors.length === 0) {
  console.log('无错误');
} else {
  errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
}

console.log('\n=== 页面文本内容（前500字符） ===');
const text = await page.evaluate(() => document.body.innerText);
console.log(text.substring(0, 500));

await page.screenshot({ path: 'test-results/debug-influxdb.png', fullPage: false });
console.log('\n截图已保存: test-results/debug-influxdb.png');

await browser.close();
