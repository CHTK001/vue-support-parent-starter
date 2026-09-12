const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await page.goto('http://127.0.0.1:18080/local', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const rows = page.locator('.fs-details-row');
  const first = rows.first();
  // 双击触发 openPreview
  await first.dblclick({ force: true });
  await page.waitForTimeout(2000);

  const dlgCnt = await page.locator('.el-dialog').count();
  console.log('dialog count:', dlgCnt);
  if (dlgCnt > 0) {
    const dlg = await page.locator('.el-dialog');
    console.log('dialog visible:', await dlg.isVisible());
    const text = await dlg.innerText().catch(() => '');
    console.log('dialog text:', text.slice(0, 120));
    const kind = await dlg.locator('.el-tag').innerText().catch(() => '');
    console.log('kind tag:', kind);
    // 截图预览
    await page.screenshot({ path: 'D:/ch/project/.local-run/kod/fs-dialog-test.png' });
  } else {
    // 可能被关闭，看看 previewVisible 状态 - 直接点击一次试试单次点击触发预览? 不，单击只选中
    console.log('no dialog; errs:', JSON.stringify(errs));
    await page.screenshot({ path: 'D:/ch/project/.local-run/kod/fs-dialog-none.png' });
  }
  await browser.close();
})();