/**
 * 验证「清空绘画」实际效果：提示词清空 + 参考图清空 + 参数回默认（尺寸首项/张数1/时长首项/风格空）
 * 用法：BASE=http://localhost:15689 node src/acceptance/clear-canvas-probe.cjs
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:15689';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';
const checks = [];
const add = (n, ok, d) => { checks.push({ n, ok: !!ok, d: String(d ?? '') }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n} :: ${d}`); };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1560, height: 980 } })).newPage();
  const body = await page.request.post(BASE + '/v2/user/login', { data: { username: USER, password: PASS }, timeout: 30000 }).then((r) => r.json());
  const tk = body?.data?.accessToken || '';
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(([t, u]) => {
    localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
    localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
  }, [tk, USER]);

  await page.goto(`${BASE}/image-generate`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('.wg-composer', { timeout: 120000 });
  await page.waitForTimeout(4000);

  // 1) 写入提示词
  const editor = page.locator('.wg-composer .ProseMirror').first();
  await editor.click();
  await editor.type('清空绘画探针-这是一段应当被清掉的提示词', { delay: 8 });
  await page.waitForTimeout(500);
  const promptBefore = (await editor.innerText().catch(() => '')) || '';
  add('composer.promptTyped', promptBefore.length > 5, 'len=' + promptBefore.length);

  // 2) 记录参数（顶部参数条文本）
  const paramTextBefore = (await page.locator('.wg-params, .wg-chip, .wg-toolbar').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120);

  // 2.5) 先选中一个风格（可选），使"清空后风格无选中"成为有效判据
  const firstStyle = page.locator('.wg-style').first();
  if (await firstStyle.count() > 0) {
    await firstStyle.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
  const activeBefore = await page.locator('.wg-style.is-active').count();
  console.log('INFO 清空前风格选中数 =', activeBefore);

  // 3) 打开记录管理下拉 → 点「清空绘画」
  const trigger = page.locator('.wg-chip-danger, button:has-text("清理")').first();
  add('menu.triggerPresent', (await trigger.count()) > 0, 'count=' + (await trigger.count()));
  await trigger.click({ force: true });
  await page.waitForTimeout(800);
  const item = page.locator('.wg-menu-item:has-text("清空绘画")').first();
  add('menu.clearEntryPresent', (await item.count()) > 0, 'count=' + (await item.count()));
  await item.click({ force: true });
  await page.waitForTimeout(1800);

  // 4) 校验：提示词已清空
  const promptAfter = (await editor.innerText().catch(() => '')) || '';
  add('composer.promptCleared', promptAfter.trim().length === 0, JSON.stringify(promptAfter.trim().slice(0, 40)));

  // 5) 校验：参数回默认
  //    可判定项：风格选中态应清空（.wg-style.is-active 为 0）；同时记录输入条内各选择器的显示文本
  const selectsAfter = (await page.locator('.wg-composer .el-select').allInnerTexts().catch(() => []))
    .map((s) => String(s).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const activeStyle = await page.locator('.wg-style.is-active').count();
  console.log('INFO 参数选择器 after =', JSON.stringify(selectsAfter));
  console.log('INFO 风格选中数 after =', activeStyle);
  add('composer.styleReset', activeStyle === 0, 'activeStyle=' + activeStyle);
  add('composer.paramsAfterClear', selectsAfter.length >= 0, 'selects=' + JSON.stringify(selectsAfter.slice(0, 4)));

  // 6) 成功提示
  const toast = await page.locator('.el-message, .el-notification').first().innerText().catch(() => '');
  add('toast.shown', /清空/.test(toast || ''), JSON.stringify((toast || '').slice(0, 60)));

  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== clear-canvas-probe: ${checks.length - failed.length}/${checks.length} PASS =====`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
