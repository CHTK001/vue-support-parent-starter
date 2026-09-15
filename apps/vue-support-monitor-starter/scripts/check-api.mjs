import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const failedRequests = [];
page.on('response', response => {
  if (response.status() >= 400) {
    failedRequests.push({ url: response.url(), status: response.status() });
  }
});

console.log('打开首页...');
await page.goto('http://127.0.0.1:8848/#/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(8000);

console.log('\n=== 失败的请求 ===');
failedRequests.forEach((req, i) => {
  console.log(`${i + 1}. [${req.status}] ${req.url.substring(0, 100)}`);
});

// 测试后端接口
console.log('\n=== 测试后端接口 ===');
const apis = [
  '/ms/monitor/config',
  '/ms/monitor/agent/list?page=1&size=5',
  '/ms/monitor/alarm/list?page=1&size=5',
  '/ms/server/group/tree',
];

for (const api of apis) {
  try {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return { status: res.status, ok: res.ok };
    }, `http://127.0.0.1:8081${api}`);
    console.log(`${api}: ${response.status} ${response.ok ? '✓' : '✗'}`);
  } catch (e) {
    console.log(`${api}: 错误 - ${e.message.substring(0, 50)}`);
  }
}

await browser.close();
console.log('\n完成。');
