// vue-layout-enhancement 浏览器自动化测试
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 启动浏览器测试...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // 监听控制台错误
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    console.log('📍 访问 http://localhost:8848/');
    await page.goto('http://localhost:8848/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ 页面加载成功\n');
    
    // 测试1: 检查 navbar 是否存在
    console.log('🔍 测试1: 检查 navbar 组件');
    const navbar = await page.locator('.lay-navbar, [class*="navbar"]').first();
    if (await navbar.count() > 0) {
      console.log('✅ navbar 组件存在');
    } else {
      console.log('⚠️  navbar 组件未找到');
    }
    
    // 测试2: 检查 footer 是否存在
    console.log('\n🔍 测试2: 检查 footer 组件');
    const footer = await page.locator('.lay-footer, [class*="footer"]').first();
    if (await footer.count() > 0) {
      console.log('✅ footer 组件存在');
    } else {
      console.log('⚠️  footer 组件未找到');
    }
    
    // 测试3: 检查主题切换器
    console.log('\n🔍 测试3: 查找主题切换器');
    const themeBtn = await page.locator('[class*="theme"], [class*="setting"]').first();
    if (await themeBtn.count() > 0) {
      console.log('✅ 找到主题相关按钮');
      
      // 尝试点击打开设置面板
      try {
        await themeBtn.click({ timeout: 2000 });
        await page.waitForTimeout(1000);
        console.log('✅ 点击主题按钮成功');
        
        // 检查是否有节日主题选项
        const halloween = await page.getByText(/halloween|万圣节/i);
        const christmas = await page.getByText(/christmas|圣诞/i);
        const springFestival = await page.getByText(/spring.*festival|春节/i);
        
        if (await halloween.count() > 0) console.log('✅ 找到 Halloween 主题');
        if (await christmas.count() > 0) console.log('✅ 找到 Christmas 主题');
        if (await springFestival.count() > 0) console.log('✅ 找到 Spring Festival 主题');
        
      } catch (e) {
        console.log('⚠️  无法点击主题按钮:', e.message);
      }
    } else {
      console.log('⚠️  未找到主题切换器');
    }
    
    // 测试4: 截图保存
    console.log('\n📸 保存截图...');
    await page.screenshot({ path: 'vue-support-parent-starter/test-screenshot.png', fullPage: true });
    console.log('✅ 截图已保存到 test-screenshot.png');
    
    // 测试5: 检查是否有运行时错误
    console.log('\n🔍 测试5: 检查运行时错误');
    if (errors.length === 0) {
      console.log('✅ 无运行时错误');
    } else {
      console.log(`❌ 发现 ${errors.length} 个错误:`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    console.log('\n✨ 测试完成！浏览器将保持打开状态供手动检查...');
    console.log('按 Ctrl+C 关闭浏览器');
    
    // 保持浏览器打开
    await page.waitForTimeout(300000); // 5分钟
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
})();
