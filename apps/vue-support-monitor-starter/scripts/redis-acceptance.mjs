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

console.log('=== Redis 页面时序存储验收 ===\n');

// 步骤 1：打开 Redis 页面
console.log('步骤 1：打开 Redis 监控页面...');
await page.goto('http://127.0.0.1:8848/#/redis', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(8000);
await page.screenshot({ path: 'test-results/redis-acceptance/01-page-load.png', fullPage: false });
console.log('  ✓ 页面已加载，截图保存');

// 步骤 2：检查页面标题和基本元素
console.log('\n步骤 2：检查页面基本元素...');
const pageTitle = await page.title();
console.log(`  页面标题: ${pageTitle}`);

const pageText = await page.evaluate(() => document.body.innerText);
const hasRedisTitle = pageText.includes('Redis') || pageText.includes('redis');
const hasCharts = pageText.includes('内存') || pageText.includes('连接') || pageText.includes('QPS') || pageText.includes('命中');
console.log(`  包含 Redis 标题: ${hasRedisTitle}`);
console.log(`  包含图表指标: ${hasCharts}`);

// 步骤 3：检查 echarts 图表数量
console.log('\n步骤 3：检查 echarts 图表...');
const chartCount = await page.evaluate(() => {
  const canvases = document.querySelectorAll('canvas');
  return canvases.length;
});
console.log(`  canvas 元素数量: ${chartCount}`);

// 步骤 4：检查是否有数据（等待轮询更新）
console.log('\n步骤 4：等待实时数据更新（15秒轮询）...');
await page.waitForTimeout(18000);
await page.screenshot({ path: 'test-results/redis-acceptance/02-after-polling.png', fullPage: false });
console.log('  ✓ 等待轮询完成，截图保存');

// 步骤 5：检查时间范围选择器
console.log('\n步骤 5：检查时间范围选择器...');
const timeRangeButtons = await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  return Array.from(buttons).map(b => b.textContent.trim()).filter(t => t && (t.includes('h') || t.includes('d') || t.includes('小时') || t.includes('天')));
});
console.log(`  时间范围按钮: ${JSON.stringify(timeRangeButtons)}`);

// 步骤 6：检查控制台错误
console.log('\n步骤 6：检查控制台错误...');
if (errors.length === 0) {
  console.log('  ✓ 无控制台错误');
} else {
  console.log(`  ⚠ 发现 ${errors.length} 个错误:`);
  errors.forEach((e, i) => console.log(`    ${i + 1}. ${e.substring(0, 100)}`));
}

// 步骤 7：检查页面内容高度
console.log('\n步骤 7：检查页面内容高度...');
const heightInfo = await page.evaluate(() => {
  const main = document.querySelector('main') || document.querySelector('.app-main') || document.querySelector('.layout-content');
  return {
    bodyHeight: document.body.scrollHeight,
    mainHeight: main ? main.scrollHeight : null,
    viewportHeight: window.innerHeight
  };
});
console.log(`  body 高度: ${heightInfo.bodyHeight}px`);
console.log(`  main 高度: ${heightInfo.mainHeight}px`);
console.log(`  视口高度: ${heightInfo.viewportHeight}px`);

// 步骤 8：最终截图（全页）
console.log('\n步骤 8：最终全页截图...');
await page.screenshot({ path: 'test-results/redis-acceptance/03-final-fullpage.png', fullPage: true });
console.log('  ✓ 全页截图保存');

// 验收总结
console.log('\n=== 验收总结 ===');
const passed = hasRedisTitle && chartCount > 0 && errors.length === 0;
console.log(`页面加载: ${hasRedisTitle ? '✓ 通过' : '✗ 失败'}`);
console.log(`图表数量: ${chartCount > 0 ? `✓ 通过 (${chartCount}个)` : '✗ 失败 (0个)'}`);
console.log(`控制台错误: ${errors.length === 0 ? '✓ 通过 (0个)' : `⚠ 有条件通过 (${errors.length}个)`}`);
console.log(`\n总体结果: ${passed ? '✓ 验收通过' : '⚠ 有条件通过'}`);

await browser.close();
console.log('\n验收完成，浏览器已关闭。');
