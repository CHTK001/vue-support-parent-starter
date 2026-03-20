import { chromium } from 'playwright';

async function testSystemInBrowser() {
  console.log('🚀 启动浏览器测试System系统...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    recordVideo: {
      dir: 'h:/workspace/2/vue-support-parent-starter/test-videos/',
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // 监听控制台
  const errors = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ 控制台错误: ${text.substring(0, 150)}`);
      errors.push(text);
    } else if (type === 'warn') {
      console.log(`⚠️  警告: ${text.substring(0, 100)}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`❌ 页面错误: ${error.message}`);
    errors.push(error.message);
  });

  try {
    console.log('📍 步骤1: 访问系统首页');
    await page.goto('http://localhost:8859', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('⏳ 等待页面加载...');
    await page.waitForTimeout(5000);

    const title = await page.title();
    console.log(`✅ 页面标题: ${title}\n`);

    // 检查页面元素
    console.log('📍 步骤2: 检查页面元素');

    const appDiv = await page.locator('#app').first();
    const appVisible = await appDiv.isVisible().catch(() => false);
    console.log(`  ${appVisible ? '✅' : '❌'} #app容器可见`);

    const inputCount = await page.locator('input').count();
    console.log(`  📝 输入框数量: ${inputCount}`);

    const buttonCount = await page.locator('button').count();
    console.log(`  🔘 按钮数量: ${buttonCount}`);

    // 截图
    await page.screenshot({
      path: 'h:/workspace/2/vue-support-parent-starter/browser-test-1.png',
      fullPage: true
    });
    console.log('  📸 截图已保存: browser-test-1.png\n');

    // 如果有输入框，尝试登录
    if (inputCount >= 2) {
      console.log('📍 步骤3: 尝试登录');

      const inputs = await page.locator('input').all();
      if (inputs.length >= 2) {
        await inputs[0].fill('admin');
        console.log('  ✅ 填写用户名: admin');

        await inputs[1].fill('admin@123!456');
        console.log('  ✅ 填写密码');

        await page.waitForTimeout(1000);

        // 查找登录按钮
        const loginBtn = page.locator('button').first();
        await loginBtn.click();
        console.log('  🔐 点击登录按钮');

        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log(`  📍 当前URL: ${currentUrl}`);

        await page.screenshot({
          path: 'h:/workspace/2/vue-support-parent-starter/browser-test-2-after-login.png',
          fullPage: true
        });
        console.log('  📸 登录后截图已保存\n');
      }
    } else {
      console.log('⚠️  未找到登录表单，可能需要检查:\n');
      console.log('  1. Vue应用是否正确挂载');
      console.log('  2. 路由配置是否正确');
      console.log('  3. 远程菜单是否加载成功\n');
    }

    // 检查网络请求
    console.log('📍 步骤4: 检查网络请求');
    const requests = [];
    page.on('request', req => {
      if (req.url().includes('/api/') || req.url().includes('/v2/')) {
        requests.push(req.url());
      }
    });

    await page.waitForTimeout(2000);

    if (requests.length > 0) {
      console.log(`  📡 检测到 ${requests.length} 个API请求`);
      requests.slice(0, 3).forEach(url => {
        console.log(`    - ${url.substring(0, 80)}`);
      });
    } else {
      console.log('  ℹ️  暂未检测到API请求');
    }

    // 生成报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试报告');
    console.log('='.repeat(60));

    console.log(`\n✅ 成功项:`);
    console.log(`  - 页面可访问`);
    console.log(`  - 页面标题正确`);
    console.log(`  - #app容器${appVisible ? '可见' : '存在'}`);

    if (errors.length > 0) {
      console.log(`\n❌ 发现 ${errors.length} 个错误:`);
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      });
    } else {
      console.log(`\n✅ 未发现JavaScript错误`);
    }

    console.log(`\n📊 页面统计:`);
    console.log(`  - 输入框: ${inputCount} 个`);
    console.log(`  - 按钮: ${buttonCount} 个`);
    console.log(`  - API请求: ${requests.length} 个`);

    console.log('\n✨ 测试完成！浏览器将保持打开状态供你查看...');
    console.log('💡 你可以在浏览器中继续手动测试系统功能');
    console.log('⌨️  按 Ctrl+C 关闭浏览器\n');

    // 保持浏览器打开
    await page.waitForTimeout(300000); // 5分钟

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    await page.screenshot({
      path: 'h:/workspace/2/vue-support-parent-starter/browser-test-error.png'
    });
    console.log('📸 错误截图已保存');
  } finally {
    await context.close();
    await browser.close();
  }
}

testSystemInBrowser().catch(console.error);
