// 补拍：把图片库滚动到视口内再截图
//
// 为什么单独写：pw-lib-settings.mjs 的断言是对的（.lib-slot 826x642、缩略图 9/9
// naturalWidth>0），但它 screenshot() 时**没有把面板滚进视口**，
// 于是 lib-1/lib-2 两张图拍到的是页面中段的「OCR 文字识别」，图片库根本没入镜。
// 断言全绿、截图是坏的 —— 这正是本项目已踩过 3 次的坑，必须补。
//
// 这个脚本不传文件，避免再往底库塞重复测试图。
//
// 运行：node pw-lib-shots.mjs   （在 vue-support-parent-starter 下）
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:15689';
const SHOTS = 'D:/ch/project/.run/deploy/pw-shots-lib';
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, locale: 'zh-CN' });
const page = await ctx.newPage();

try {
  await page.goto(BASE + '/setting/default-models', { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (!(await page.locator('input[type="password"]').count())) {
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  }
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('form button').last().click({ timeout: 20000 });
  await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 60000 });
  console.log('登录 OK');

  await page.goto(BASE + '/setting/default-models', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('.lib-slot', { timeout: 90000 });
  await page.waitForTimeout(2500);

  // 展开全部分组
  const heads = page.locator('.el-collapse-item__header');
  const hc = await heads.count();
  for (let i = 0; i < hc; i++) {
    const h = heads.nth(i);
    if (!(await h.isVisible().catch(() => false))) { continue; }
    const open = await h.evaluate((e) => e.parentElement.classList.contains('is-active')).catch(() => true);
    if (!open) { await h.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(400); }
  }
  await page.waitForTimeout(2000);

  // 关键：把图片库滚到视口正中再拍
  const slot = page.locator('.lib-slot').first();
  await slot.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  const box = await slot.boundingBox();
  console.log('  .lib-slot boundingBox = ' + JSON.stringify(box));
  const inView = await slot.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight,
             visible: r.top < window.innerHeight && r.bottom > 0 };
  });
  console.log('  入镜情况 = ' + JSON.stringify(inView));
  if (!inView.visible) { console.log('  [WARN] 仍不在视口内，截图会拍不到'); }

  await page.screenshot({ path: `${SHOTS}/lib-5-library-inview.png` });
  console.log('  -> lib-5-library-inview.png');

  // 再拍一张整块面板（element 截图，不受视口裁剪影响）
  await slot.screenshot({ path: `${SHOTS}/lib-6-library-panel.png` });
  console.log('  -> lib-6-library-panel.png');

  // 整组（含图片库所属的 image_search 分组）单独拍一张，便于看它挂在分组内的位置
  const item = page.locator('.el-collapse-item').filter({ has: page.locator('.lib-slot') }).first();
  if (await item.count()) {
    await item.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await item.screenshot({ path: `${SHOTS}/lib-7-group-context.png` });
    console.log('  -> lib-7-group-context.png');
  }

  // 点开第一张看查看器
  await page.locator('.lib-thumb').first().click({ timeout: 15000 });
  await page.waitForSelector('.l-dialog__overlay.is-shown', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const dlg = page.locator('.l-dialog').first();
  await dlg.screenshot({ path: `${SHOTS}/lib-8-viewer-dialog.png` });
  console.log('  -> lib-8-viewer-dialog.png');
} catch (e) {
  console.log('[ERR] ' + String(e).slice(0, 300));
} finally {
  await browser.close();
}
console.log('SHOTS_DONE');
