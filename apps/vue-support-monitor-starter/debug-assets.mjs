import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

// 收集网络请求
const requests = [];
page.on('response', res => {
  if (res.url().includes('ms/server') || res.url().includes('host')) {
    requests.push({ url: res.url(), status: res.status() });
  }
});

// 收集控制台错误
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    consoleErrors.push(`[${msg.type()}] ${msg.text().substring(0, 200)}`);
  }
});

console.log('=== 访问主机资产页面 ===');
await page.goto('http://127.0.0.1:8848/#/assets', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);

console.log('\n=== 网络请求（ms/server相关）===');
requests.forEach(r => console.log(`  [${r.status}] ${r.url.substring(0, 100)}`));

console.log('\n=== 控制台错误/警告 ===');
consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e}`));

// 直接测试后端API
console.log('\n=== 直接测试后端API ===');
const apiResponse = await page.evaluate(async () => {
  try {
    const res = await fetch('http://127.0.0.1:8081/ms/server/host');
    const data = await res.json();
    return { status: res.status, dataLength: JSON.stringify(data).length, hasData: Array.isArray(data) ? data.length : (data.data ? data.data.length : 'unknown') };
  } catch (e) {
    return { error: e.message };
  }
});
console.log(JSON.stringify(apiResponse, null, 2));

await browser.close();
console.log('\n完成');
