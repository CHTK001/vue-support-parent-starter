import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = 'test-results/crud-acceptance/assets';
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const results = [];

async function step(name, action) {
  console.log(`\n=== ${name} ===`);
  try {
    await action();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: false });
    const text = await page.evaluate(() => document.body.innerText);
    results.push({ step: name, status: 'pass', textLength: text.length });
    console.log(`  ✅ 完成，文本长度: ${text.length}`);
    return text;
  } catch (e) {
    results.push({ step: name, status: 'fail', error: e.message });
    console.log(`  ❌ 失败: ${e.message.substring(0, 100)}`);
    return null;
  }
}

console.log('=== 主机资产 CRUD 操作验收 ===\n');

// 1. 打开主机资产页面
await step('01-打开主机资产页面', async () => {
  await page.goto('http://127.0.0.1:8848/#/assets', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
});

// 2. 记录初始数据数量
let initialText = await page.evaluate(() => document.body.innerText);
const initialCount = (initialText.match(/共\s*(\d+)\s*条/) || [])[1] || '未知';
console.log(`初始数据条数: ${initialCount}`);

// 3. 点击新增资产按钮
await step('02-点击新增资产按钮', async () => {
  const addBtn = page.locator('button:has-text("新增资产"), button:has-text("新增"), .el-button--primary').first();
  await addBtn.click();
  await page.waitForTimeout(1000);
});

// 4. 填写新增表单
await step('03-填写新增主机表单', async () => {
  // 填写主机名称
  const nameInput = page.locator('input[placeholder*="名称"], input[placeholder*="主机名"], .el-dialog input').first();
  await nameInput.fill('CRUD测试主机-验收001');
  
  // 填写IP地址
  const ipInput = page.locator('input[placeholder*="IP"], input[placeholder*="地址"], .el-dialog input').nth(1);
  await ipInput.fill('10.0.0.100');
  
  // 填写端口
  const portInput = page.locator('input[placeholder*="端口"], .el-dialog input').nth(2);
  await portInput.fill('22');
  
  // 填写描述
  const descInput = page.locator('textarea, input[placeholder*="描述"], input[placeholder*="备注"]').first();
  await descInput.fill('这是CRUD验收测试创建的主机，验证新增功能');
  
  await page.waitForTimeout(500);
});

// 5. 提交新增表单
await step('04-提交新增表单', async () => {
  const submitBtn = page.locator('.el-dialog button:has-text("确定"), .el-dialog button:has-text("保存"), .el-dialog button:has-text("提交")').first();
  await submitBtn.click();
  await page.waitForTimeout(2000);
});

// 6. 验证新增成功
let afterAddText = await step('05-验证新增成功', async () => {
  await page.waitForTimeout(1000);
});
const hasNewHost = afterAddText && afterAddText.includes('CRUD测试主机-验收001');
console.log(`新增主机是否显示: ${hasNewHost ? '✅ 是' : '❌ 否'}`);

// 7. 搜索新增的主机
await step('06-搜索新增主机', async () => {
  const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="名称"], .el-input__inner').first();
  await searchInput.fill('CRUD测试主机-验收001');
  await page.waitForTimeout(1000);
  await searchInput.press('Enter');
  await page.waitForTimeout(1500);
});

// 8. 点击编辑按钮
await step('07-点击编辑按钮', async () => {
  const editBtn = page.locator('button:has-text("编辑"), .el-icon-edit, [title*="编辑"]').first();
  await editBtn.click();
  await page.waitForTimeout(1000);
});

// 9. 修改主机信息
await step('08-修改主机信息', async () => {
  const nameInput = page.locator('.el-dialog input').first();
  await nameInput.fill('CRUD测试主机-已修改001');
  
  const descInput = page.locator('.el-dialog textarea, .el-dialog input[placeholder*="描述"]').first();
  await descInput.fill('这是CRUD验收测试修改后的主机，验证编辑功能');
  
  await page.waitForTimeout(500);
});

// 10. 提交编辑
await step('09-提交编辑', async () => {
  const submitBtn = page.locator('.el-dialog button:has-text("确定"), .el-dialog button:has-text("保存")').first();
  await submitBtn.click();
  await page.waitForTimeout(2000);
});

// 11. 验证编辑成功
let afterEditText = await step('10-验证编辑成功', async () => {
  await page.waitForTimeout(1000);
});
const hasModifiedHost = afterEditText && afterEditText.includes('CRUD测试主机-已修改001');
console.log(`修改后主机是否显示: ${hasModifiedHost ? '✅ 是' : '❌ 否'}`);

// 12. 点击删除按钮
await step('11-点击删除按钮', async () => {
  const deleteBtn = page.locator('button:has-text("删除"), .el-icon-delete, [title*="删除"]').first();
  await deleteBtn.click();
  await page.waitForTimeout(1000);
});

// 13. 确认删除
await step('12-确认删除', async () => {
  const confirmBtn = page.locator('.el-message-box button:has-text("确定"), .el-message-box button:has-text("确认")').first();
  await confirmBtn.click();
  await page.waitForTimeout(2000);
});

// 14. 验证删除成功
let afterDeleteText = await step('13-验证删除成功', async () => {
  // 清空搜索框
  const searchInput = page.locator('input[placeholder*="搜索"], .el-input__inner').first();
  await searchInput.fill('');
  await searchInput.press('Enter');
  await page.waitForTimeout(1500);
});
const deletedHostGone = afterDeleteText && !afterDeleteText.includes('CRUD测试主机-已修改001');
console.log(`删除后主机是否消失: ${deletedHostGone ? '✅ 是' : '❌ 否'}`);

// 汇总
console.log('\n=== 主机资产 CRUD 验收结果 ===');
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
console.log(`总步骤: ${results.length}`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`新增主机显示: ${hasNewHost ? '✅' : '❌'}`);
console.log(`修改主机显示: ${hasModifiedHost ? '✅' : '❌'}`);
console.log(`删除主机消失: ${deletedHostGone ? '✅' : '❌'}`);

fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify({
  results,
  hasNewHost,
  hasModifiedHost,
  deletedHostGone,
  initialCount
}, null, 2));

await browser.close();
console.log('\n验收完成。截图保存在:', screenshotDir);
