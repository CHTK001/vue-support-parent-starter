import { chromium } from 'playwright';

async function quickTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('访问 http://localhost:8848...');
  await page.goto('http://localhost:8848', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForTimeout(5000);

  // 获取页面标题
  const title = await page.title();
  console.log('页面标题:', title);

  // 获取页面HTML
  const html = await page.content();
  console.log('页面HTML长度:', html.length);

  // 检查是否有错误
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(3000);

  if (errors.length > 0) {
    console.log('\n控制台错误:');
    errors.forEach(err => console.log('  -', err.substring(0, 200)));
  }

  // 截图
  await page.screenshot({ path: 'h:/workspace/2/vue-support-parent-starter/quick-test.png' });
  console.log('\n截图已保存到 quick-test.png');

  console.log('\n浏览器将保持打开30秒供查看...');
  await page.waitForTimeout(30000);

  await browser.close();
}

quickTest().catch(console.error);
