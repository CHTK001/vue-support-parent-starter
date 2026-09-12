const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 捕获所有网络请求
  const requests = [];
  page.on('request', (req) => {
    if (req.url().includes('/v2/') || req.url().includes('/api/')) {
      requests.push({ method: req.method(), url: req.url() });
    }
  });
  page.on('response', (resp) => {
    if (resp.url().includes('/v2/') || resp.url().includes('/api/')) {
      console.log(`RESPONSE: ${resp.request().method()} ${resp.url()} -> ${resp.status()}`);
    }
  });

  // 测试角色表单
  console.log('\n=== 角色表单测试 ===');
  await page.goto('http://localhost:19094/#/roles', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("新建角色")').first().click();
  await page.waitForTimeout(1500);

  const roleModal = page.locator('.arco-modal').first();
  const roleInputs = await roleModal.locator('input').all();
  console.log('角色表单 input 数量:', roleInputs.length);
  for (let i = 0; i < roleInputs.length; i++) {
    const ph = await roleInputs[i].getAttribute('placeholder') || '';
    const val = await roleInputs[i].inputValue().catch(() => '');
    console.log(`  [${i}] ph='${ph}', val='${val}'`);
  }

  const roleTextareas = await roleModal.locator('textarea').all();
  console.log('角色表单 textarea 数量:', roleTextareas.length);
  for (let i = 0; i < roleTextareas.length; i++) {
    const ph = await roleTextareas[i].getAttribute('placeholder') || '';
    console.log(`  [${i}] ph='${ph}'`);
  }

  const roleSelects = await roleModal.locator('.arco-select').all();
  console.log('角色表单 select 数量:', roleSelects.length);

  // 填写所有 input
  for (let i = 0; i < roleInputs.length; i++) {
    if (!(await roleInputs[i].isDisabled())) {
      await roleInputs[i].fill('e2e-test-' + i);
    }
  }
  // 填写所有 textarea
  for (let i = 0; i < roleTextareas.length; i++) {
    await roleTextareas[i].fill('e2e test description');
  }

  const roleOkBtn = roleModal.locator('button:has-text("确定"), button:has-text("保存")').first();
  console.log('角色确定按钮 disabled:', await roleOkBtn.isDisabled());

  // 清空请求记录
  requests.length = 0;
  await roleOkBtn.click();
  await page.waitForTimeout(3000);

  console.log('角色提交后请求:', JSON.stringify(requests, null, 2));

  // 测试 MCP 表单
  console.log('\n=== MCP 表单测试 ===');
  await page.goto('http://localhost:19094/#/mcp', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("新建服务器"), button:has-text("添加服务器"), button:has-text("新建")').first().click();
  await page.waitForTimeout(1500);

  const mcpModal = page.locator('.arco-modal').first();
  const mcpInputs = await mcpModal.locator('input').all();
  console.log('MCP 表单 input 数量:', mcpInputs.length);
  for (let i = 0; i < mcpInputs.length; i++) {
    const ph = await mcpInputs[i].getAttribute('placeholder') || '';
    const val = await mcpInputs[i].inputValue().catch(() => '');
    console.log(`  [${i}] ph='${ph}', val='${val}'`);
  }

  const mcpSelects = await mcpModal.locator('.arco-select').all();
  console.log('MCP 表单 select 数量:', mcpSelects.length);

  // 填写所有 input
  for (let i = 0; i < mcpInputs.length; i++) {
    if (!(await mcpInputs[i].isDisabled())) {
      await mcpInputs[i].fill('e2e-test-' + i);
    }
  }

  const mcpOkBtn = mcpModal.locator('button:has-text("确定"), button:has-text("保存")').first();
  console.log('MCP 确定按钮 disabled:', await mcpOkBtn.isDisabled());

  requests.length = 0;
  await mcpOkBtn.click();
  await page.waitForTimeout(3000);

  console.log('MCP 提交后请求:', JSON.stringify(requests, null, 2));

  await browser.close();
})();
