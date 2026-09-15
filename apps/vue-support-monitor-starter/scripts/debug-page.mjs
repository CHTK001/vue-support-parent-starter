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
await page.waitForTimeout(20000);

console.log('\n=== 已注册的路由 ===');
const routes = await page.evaluate(() => {
  // 从 vue-router 获取所有路由
  const app = document.querySelector('#app').__vue_app__;
  if (app && app.config.globalProperties.$router) {
    return app.config.globalProperties.$router.getRoutes().map(r => ({
      path: r.path,
      name: r.name,
      redirect: r.redirect,
      hasComponent: !!r.components?.default
    }));
  }
  return [];
});
console.log(JSON.stringify(routes, null, 2).substring(0, 3000));

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

console.log('\n=== 页面结构 ===');
const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
console.log(bodyHTML);

console.log('\n=== 内容区高度 ===');
const heights = await page.evaluate(() => {
  const main = document.querySelector('.el-main, .koi-layout__content, main');
  const telPage = document.querySelector('.tel-page');
  const as = document.querySelector('.as');
  return {
    main: main ? { height: main.offsetHeight, width: main.offsetWidth, className: main.className } : null,
    telPage: telPage ? { height: telPage.offsetHeight, width: telPage.offsetWidth, className: telPage.className } : null,
    as: as ? { height: as.offsetHeight, width: as.offsetWidth, className: as.className } : null,
    body: { height: document.body.offsetHeight, width: document.body.offsetWidth }
  };
});
console.log(JSON.stringify(heights, null, 2));

console.log('\n=== 页面文本内容 ===');
const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
console.log(text);

await page.screenshot({ path: 'test-results/debug-assets.png', fullPage: true });
console.log('\n截图已保存: test-results/debug-assets.png');

await browser.close();
