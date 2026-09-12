const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:19094/#/models', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("新建模型")').first().click();
  await page.waitForTimeout(1500);

  const modal = page.locator('.arco-modal').first();
  const inputs = await modal.locator('input').all();
  console.log('=== 模型表单 input ===');
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder') || '';
    const type = await inputs[i].getAttribute('type') || 'text';
    const val = await inputs[i].inputValue().catch(() => '');
    const dis = await inputs[i].isDisabled();
    console.log(`[${i}] type=${type}, ph='${ph}', val='${val}', dis=${dis}`);
  }

  const selects = await modal.locator('.arco-select').all();
  console.log('\n=== 模型表单 select ===');
  for (let i = 0; i < selects.length; i++) {
    const text = await selects[i].innerText().catch(() => '');
    console.log(`[${i}] text='${text.substring(0,60)}'`);
  }

  const textareas = await modal.locator('textarea').all();
  console.log('\n=== 模型表单 textarea ===');
  for (let i = 0; i < textareas.length; i++) {
    const ph = await textareas[i].getAttribute('placeholder') || '';
    console.log(`[${i}] ph='${ph}'`);
  }

  const okBtn = modal.locator('button:has-text("确定")').first();
  console.log('\n确定按钮 disabled:', await okBtn.isDisabled());

  // 检查表单 label
  const labels = await modal.locator('.arco-form-item-label').all();
  console.log('\n=== 表单 label ===');
  for (let i = 0; i < labels.length; i++) {
    const text = await labels[i].innerText().catch(() => '');
    console.log(`[${i}] '${text}'`);
  }

  await browser.close();
})();
