const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:18080/local', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const rows = page.locator('.fs-details-row');
  const cnt = await rows.count();
  console.log('rows:', cnt);
  if (cnt > 0) {
    const first = rows.first();
    const box = await first.boundingBox();
    console.log('first row box:', JSON.stringify(box));
    // 精确右键
    await first.click({ button: 'right', force: true });
    await page.waitForTimeout(800);
    const ctxCnt = await page.locator('.fs-ctx').count();
    const ctxStyle = ctxCnt > 0 ? await page.locator('.fs-ctx').getAttribute('style') : 'none';
    console.log('ctx count:', ctxCnt, '| style:', ctxStyle);
    // 直接双击第一个文件测试预览
    await first.dblclick({ force: true });
    await page.waitForTimeout(2500);
    const dlgCnt = await page.locator('.el-dialog').count();
    console.log('dialog count:', dlgCnt);
    if (dlgCnt > 0) {
      const dlg = await page.locator('.el-dialog').innerText().catch(() => '');
      console.log('dialog text:', dlg.slice(0, 100));
    }
  }
  await browser.close();
})();