import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // 监听网络请求
  const apiCalls = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/v2/project') || url.includes('/v1/panel')) {
      try {
        const body = await res.json().catch(() => null);
        apiCalls.push({ url, status: res.status(), body });
      } catch {}
    }
  });

  try {
    console.log('1. 打开 panel...');
    await page.goto('http://localhost:8868', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tmp-proj-01-home.png' });
    console.log('   title:', await page.title());

    // 截图当前页面
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
    console.log('   页面内容预览:', bodyText.replace(/\n/g, ' '));

    // 尝试右键触发菜单
    console.log('2. 尝试右键...');
    await page.mouse.click(640, 400, { button: 'right' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tmp-proj-02-contextmenu.png' });

    const menuVisible = await page.$('.rightMenu').then(el => !!el).catch(() => false);
    console.log('   右键菜单出现:', menuVisible);

    if (menuVisible) {
      const menuText = await page.$eval('.rightMenu', el => el.innerText).catch(() => '');
      console.log('   菜单内容:', menuText.trim().replace(/\n/g, ' | '));

      // 点击"新建项目"
      const createItem = await page.$('.rightMenu li:first-child');
      if (createItem) {
        await createItem.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'tmp-proj-03-dialog.png' });

        const dialogVisible = await page.$('[role="dialog"], .el-dialog, .sc-dialog').then(el => !!el).catch(() => false);
        console.log('   新建对话框出现:', dialogVisible);

        if (dialogVisible) {
          // 填写项目名称
          const nameInput = await page.$('input[placeholder*="项目名称"]');
          if (nameInput) {
            await nameInput.fill('测试项目001');
            await page.waitForTimeout(300);
            await page.screenshot({ path: 'tmp-proj-04-filled.png' });
            console.log('   已填写项目名称');

            // 点击创建按钮
            const submitBtn = await page.$('button:has-text("创建"), .el-button--primary:has-text("创建")');
            if (submitBtn) {
              await submitBtn.click();
              await page.waitForTimeout(2000);
              await page.screenshot({ path: 'tmp-proj-05-after-submit.png' });
              console.log('   已点击创建按钮');
            }
          }
        }
      }
    }

    // 打印 API 调用记录
    console.log('\n📡 API 调用记录:');
    apiCalls.forEach(c => {
      console.log(`  ${c.status} ${c.url}`);
      if (c.body) console.log(`     → code: ${c.body.code}, msg: ${c.body.msg || c.body.message || ''}`);
    });

    console.log('\n✅ 完成');
  } catch (err) {
    console.error('❌ 失败:', err.message);
    await page.screenshot({ path: 'tmp-proj-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
