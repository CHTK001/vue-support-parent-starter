import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

console.log('打开首页...');
await page.goto('http://127.0.0.1:8848/#/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(8000);

// 检查左侧菜单结构
const menuInfo = await page.evaluate(() => {
  // 查找侧边栏菜单
  const sidebar = document.querySelector('.layout-sidebar') || document.querySelector('.el-menu') || document.querySelector('aside');
  const menuItems = document.querySelectorAll('.el-sub-menu, .el-menu-item');
  
  const items = [];
  menuItems.forEach(item => {
    const title = item.querySelector('.el-sub-menu__title')?.textContent?.trim() || item.textContent?.trim();
    const isGroup = item.classList.contains('el-sub-menu');
    items.push({ title: title?.substring(0, 30), isGroup, className: item.className });
  });
  
  return {
    sidebarExists: !!sidebar,
    menuItemCount: menuItems.length,
    items: items.slice(0, 30)
  };
});

console.log('\n=== 左侧菜单结构 ===');
console.log(`侧边栏存在: ${menuInfo.sidebarExists}`);
console.log(`菜单项数量: ${menuInfo.menuItemCount}`);
console.log('\n菜单项详情:');
menuInfo.items.forEach((item, i) => {
  console.log(`${i + 1}. [${item.isGroup ? '分组' : '菜单'}] ${item.title}`);
});

// 截图
await page.screenshot({ path: 'test-results/menu-check/home.png', fullPage: false });
console.log('\n截图已保存: test-results/menu-check/home.png');

await browser.close();
console.log('完成。');
