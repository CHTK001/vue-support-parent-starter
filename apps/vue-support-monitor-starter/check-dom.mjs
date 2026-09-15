import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();

console.log('访问页面...');
await page.goto('http://127.0.0.1:8848/#/assets', { timeout: 30000, waitUntil: 'commit' });
await page.waitForTimeout(10000);

console.log('点击新增按钮...');
const addBtn = page.locator('button', { hasText: /新增资产/ }).first();
await addBtn.click();
await page.waitForTimeout(5000);

// 截图
await page.screenshot({ path: 'D:/ch/project/artifacts/dom-check.png' });
console.log('截图已保存');

// 查找所有input元素
const allInputs = await page.locator('input').all();
console.log(`\n页面上有 ${allInputs.length} 个input元素`);
for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
  const placeholder = await allInputs[i].getAttribute('placeholder').catch(() => '');
  const value = await allInputs[i].inputValue().catch(() => '');
  const visible = await allInputs[i].isVisible().catch(() => false);
  console.log(`  input${i}: placeholder="${placeholder}", value="${value.substring(0,20)}", visible=${visible}`);
}

// 查找弹窗相关的元素
console.log('\n查找弹窗相关元素...');
const dialogSelectors = ['.el-dialog', '[role="dialog"]', '.re-dialog', '.el-overlay', '.el-dialog__wrapper', '.modal', '[class*="dialog"]', '[class*="Dialog"]'];
for (const selector of dialogSelectors) {
  const count = await page.locator(selector).count();
  if (count > 0) {
    console.log(`  ${selector}: ${count} 个`);
  }
}

// 打印包含"新增主机"的元素的HTML
const bodyHTML = await page.locator('body').innerHTML();
const idx = bodyHTML.indexOf('新增主机');
if (idx > -1) {
  console.log('\n包含"新增主机"的HTML片段:');
  console.log(bodyHTML.substring(Math.max(0, idx - 200), idx + 500));
}

await browser.close();
console.log('\n完成');
