import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8869';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('1. 打开 panel...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tmp-test-01-home.png' });
    console.log('   title:', await page.title(), ' URL:', page.url());

    // 列出页面所有可点击的 tab/按钮
    const tabs = await page.$$eval('[class*="tab"], [class*="rail"], [class*="nav"] *', els =>
      els.filter(el => el.textContent?.trim()).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 20), cls: el.className?.slice?.(0, 40) })).slice(0, 20)
    );
    console.log('   tabs/nav:', JSON.stringify(tabs));

    // 找"项目"相关的 tab
    const projectTab = await page.$('[class*="tab"]:has-text("项目"), li:has-text("项目"), button:has-text("项目"), [title*="项目"]');
    if (projectTab) {
      console.log('2. 点击项目 tab...');
      await projectTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tmp-test-02-project-tab.png' });
    } else {
      console.log('2. 未找到项目 tab，直接查找 .rpp__grid...');
    }

    const grid = await page.waitForSelector('.rpp__grid', { timeout: 5000 }).catch(() => null);
    console.log('   .rpp__grid 存在:', !!grid);

    if (grid) {
      const box = await grid.boundingBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;

      console.log(`3. 在 .rpp__grid (${cx.toFixed(0)}, ${cy.toFixed(0)}) 触发右键...`);
      await page.mouse.click(cx, cy, { button: 'right' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'tmp-test-03-contextmenu.png' });

      const menuVisible = await page.$eval('.rightMenu', el => {
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && el.offsetHeight > 0;
      }).catch(() => false);
      console.log('   .rightMenu 可见:', menuVisible);

      const menuText = await page.$eval('.rightMenu', el => el.innerText).catch(() => '');
      console.log('   菜单内容:', menuText.trim());

      if (menuVisible) {
        const pos = await page.$eval('.rightMenu', el => {
          const s = window.getComputedStyle(el);
          return { top: s.top, left: s.left, w: el.offsetWidth, h: el.offsetHeight };
        });
        console.log('   位置/尺寸:', pos);

        // 点击"添加项目"
        const item = await page.$('.rightMenu li');
        if (item) {
          await item.click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: 'tmp-test-04-dialog.png' });
          const dialog = await page.$('[role="dialog"], .el-dialog, .sc-dialog').then(el => !!el).catch(() => false);
          console.log('   对话框出现:', dialog);
        }
      }
    } else {
      // panel 可能需要先连接服务器，dump 页面结构
      const classes = await page.$$eval('[class]', els =>
        [...new Set(els.flatMap(el => (el.className || '').toString().split(' ')).filter(c => c.length > 3 && c.length < 50))].slice(0, 40)
      );
      console.log('   页面 class 样本:', classes);
    }

    console.log('\n✅ 完成');
  } catch (err) {
    console.error('❌ 失败:', err.message);
    await page.screenshot({ path: 'tmp-test-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
