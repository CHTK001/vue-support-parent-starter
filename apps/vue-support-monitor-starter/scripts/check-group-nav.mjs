import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// 清除 localStorage 旧值
await page.goto('http://127.0.0.1:8848/#/', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  localStorage.clear();
  console.log('localStorage 已清除');
});

// 重新加载页面
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(8000);

// 检查布局模式
const layoutInfo = await page.evaluate(() => {
  const globalStore = window.__PINIA__?.state?.value?.global;
  return {
    layout: globalStore?.layout,
    isDark: globalStore?.isDark,
    menuWidth: globalStore?.menuWidth
  };
});
console.log('布局信息:', JSON.stringify(layoutInfo));

// 检查菜单结构
const menuInfo = await page.evaluate(() => {
  const subMenus = document.querySelectorAll('.el-sub-menu');
  const menuItems = document.querySelectorAll('.el-menu-item');
  const groupTitles = Array.from(subMenus).map(m => {
    const title = m.querySelector('.el-sub-menu__title')?.textContent?.trim();
    const isOpen = m.classList.contains('is-opened');
    return { title, isOpen };
  });
  return {
    subMenuCount: subMenus.length,
    menuItemCount: menuItems.length,
    groupTitles: groupTitles.slice(0, 10)
  };
});
console.log('\n菜单结构:', JSON.stringify(menuInfo, null, 2));

// 截图
await page.screenshot({ path: 'test-results/group-nav-check.png', fullPage: false });
console.log('\n截图已保存: test-results/group-nav-check.png');

await browser.close();
console.log('完成。');
