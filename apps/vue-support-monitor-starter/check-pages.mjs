import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });

const pages = [
  { name: '监控概览', route: '/' },
  { name: '主机资产', route: '/assets' },
  { name: '数据源管理', route: '/datasource' },
  { name: '数据库管理', route: '/db-manager' },
  { name: 'Redis监控', route: '/redis' },
  { name: '分组管理', route: '/groups' },
  { name: '账号管理', route: '/account' },
];

for (const page of pages) {
  console.log(`\n=== ${page.name} (${page.route}) ===`);
  const p = await context.newPage();
  
  const errors = [];
  p.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().substring(0, 200));
  });
  p.on('pageerror', err => errors.push(`PAGEERROR: ${err.message.substring(0, 200)}`));
  
  try {
    await p.goto(`http://127.0.0.1:8848/#${page.route}`, { timeout: 30000, waitUntil: 'commit' });
    await p.waitForTimeout(10000);
    
    const bodyText = await p.locator('body').innerText();
    const hasContent = bodyText.length > 100;
    const hasEmpty = bodyText.includes('暂无数据') || bodyText.includes('加载中') || bodyText.includes('空白');
    
    console.log(`页面文本长度: ${bodyText.length}`);
    console.log(`有内容: ${hasContent}`);
    console.log(`包含空状态: ${hasEmpty}`);
    console.log(`控制台错误数: ${errors.length}`);
    if (errors.length > 0) {
      errors.slice(0, 3).forEach(e => console.log(`  错误: ${e}`));
    }
    
    // 截图
    const safeName = page.name.replace(/\//g, '-');
    await p.screenshot({ path: `D:/ch/project/artifacts/page-check-${safeName}.png` });
    console.log(`截图已保存: page-check-${safeName}.png`);
  } catch (e) {
    console.log(`页面加载失败: ${e.message}`);
  }
  
  await p.close();
}

await browser.close();
console.log('\n完成');
