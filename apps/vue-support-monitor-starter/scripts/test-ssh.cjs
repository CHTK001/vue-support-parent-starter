const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'test-results', 'ssh-test');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  console.log('=== SSH远程控制测试 ===');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // 1. 打开远程控制页面
  console.log('1. 打开远程控制页面...');
  await page.goto('http://127.0.0.1:8848/#/terminal', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-terminal-page.png'), fullPage: true });
  console.log('   页面已打开');
  
  // 2. 点击Ubuntu服务器
  console.log('2. 点击Ubuntu服务器...');
  const ubuntuHost = page.locator('text=124.221.230.112').first();
  if (await ubuntuHost.count() > 0) {
    await ubuntuHost.click();
    console.log('   点击了Ubuntu服务器');
  } else {
    const firstHost = page.locator('[class*="host"], [class*="server"], li').first();
    if (await firstHost.count() > 0) {
      await firstHost.click();
      console.log('   点击了第一个主机');
    }
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-host-selected.png'), fullPage: true });
  
  // 3. 检查身份选择弹窗
  console.log('3. 检查身份选择...');
  const modal = page.locator('[class*="modal"], [class*="dialog"], [role="dialog"]');
  if (await modal.count() > 0) {
    console.log('   检测到身份选择弹窗');
    // 选择ubuntu身份
    const identityOption = page.locator('text=ubuntu').first();
    if (await identityOption.count() > 0) {
      await identityOption.click();
      console.log('   选择了ubuntu身份');
    }
    // 点击确认
    const confirmBtn = page.locator('button:has-text("确定"), button:has-text("确认"), button:has-text("连接")').first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      console.log('   点击了确认按钮');
    }
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-identity-selected.png'), fullPage: true });
  
  // 4. 等待SSH连接建立
  console.log('4. 等待SSH连接建立（20秒）...');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `04-ssh-connecting-${(i+1)*5}s.png`), fullPage: true });
    console.log(`   ${(i+1)*5}秒 - 截图已保存`);
  }
  
  // 5. 最终截图
  console.log('5. 最终状态截图...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-ssh-final.png'), fullPage: true });
  
  // 6. 检查页面内容
  console.log('6. 检查页面内容...');
  const pageText = await page.textContent('body');
  if (pageText.includes('ubuntu@') || pageText.includes('$') || pageText.includes('#')) {
    console.log('   SSH连接成功，显示终端提示符');
  } else if (pageText.includes('连接失败') || pageText.includes('error')) {
    console.log('   SSH连接失败');
  } else {
    console.log('   页面状态未知');
  }
  
  await browser.close();
  console.log('\n=== 测试完成 ===');
  console.log(`截图保存在: ${OUTPUT_DIR}`);
})();
