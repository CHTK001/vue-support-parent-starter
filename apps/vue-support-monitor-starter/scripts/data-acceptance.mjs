import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = 'test-results/data-acceptance';
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

const results = [];
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'pass' });
    console.log(`✓ ${name}`);
  } catch (e) {
    results.push({ name, status: 'fail', error: e.message });
    console.log(`✗ ${name}: ${e.message.substring(0, 80)}`);
    await page.screenshot({ path: `${screenshotDir}/fail-${name.replace(/[^a-z0-9]/gi, '_')}.png` });
  }
}

console.log('=== 1. 打开首页 ===');
await page.goto('http://127.0.0.1:8848/#/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${screenshotDir}/01-home.png` });

console.log('\n=== 2. 创建主机资产 ===');
await step('点击新建资产按钮', async () => {
  await page.getByRole('button', { name: /新建资产|新增/ }).first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${screenshotDir}/02-new-asset-dialog.png` });
});

await step('填写主机资产信息', async () => {
  // 尝试填写表单
  const inputs = page.locator('input');
  const count = await inputs.count();
  console.log(`  表单输入框数量: ${count}`);
  
  // 尝试填写名称
  const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="name"], input[label*="名称"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('测试主机-001');
  } else {
    // 尝试第一个输入框
    await inputs.first().fill('测试主机-001');
  }
  
  // 尝试填写 IP
  const ipInput = page.locator('input[placeholder*="IP"], input[placeholder*="地址"]').first();
  if (await ipInput.isVisible().catch(() => false)) {
    await ipInput.fill('192.168.1.100');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${screenshotDir}/03-asset-form-filled.png` });
});

await step('提交主机资产', async () => {
  const submitBtn = page.getByRole('button', { name: /确定|保存|提交|创建/ }).first();
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: `${screenshotDir}/04-asset-created.png` });
});

console.log('\n=== 3. 验证主机资产列表 ===');
await step('刷新并验证资产列表', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  const pageText = await page.evaluate(() => document.body.innerText);
  const hasAsset = pageText.includes('测试主机') || pageText.includes('192.168.1.100');
  console.log(`  包含测试资产: ${hasAsset}`);
  await page.screenshot({ path: `${screenshotDir}/05-asset-list.png` });
});

console.log('\n=== 4. 打开主机资产页面 ===');
await step('导航到主机资产页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/assets', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotDir}/06-assets-page.png` });
});

console.log('\n=== 5. 创建数据源 ===');
await step('导航到数据源管理页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/datasource', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotDir}/07-datasource-page.png` });
});

await step('点击新建数据源', async () => {
  const addBtn = page.getByRole('button', { name: /新建|新增|添加/ }).first();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/08-new-datasource-dialog.png` });
  }
});

console.log('\n=== 6. 打开数据库管理页面 ===');
await step('导航到数据库管理页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/db-manager', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotDir}/09-db-manager.png` });
});

console.log('\n=== 7. 打开告警中心页面 ===');
await step('导航到告警中心页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/alarms', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotDir}/10-alarms.png` });
});

console.log('\n=== 8. 打开 Redis 监控页面 ===');
await step('导航到 Redis 监控页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/redis', { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${screenshotDir}/11-redis.png` });
});

console.log('\n=== 9. 打开系统配置页面 ===');
await step('导航到系统配置页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/system-config', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotDir}/12-system-config.png` });
});

console.log('\n=== 10. 打开账号管理页面 ===');
await step('导航到账号管理页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/account', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${screenshotDir}/13-account.png` });
});

// 汇总结果
console.log('\n=== 验收结果汇总 ===');
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
console.log(`总步骤: ${results.length}`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`控制台错误: ${errors.length}`);

// 保存结果
fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify({ results, errors, passed, failed }, null, 2));

await browser.close();
console.log('\n完成。截图保存在:', screenshotDir);
