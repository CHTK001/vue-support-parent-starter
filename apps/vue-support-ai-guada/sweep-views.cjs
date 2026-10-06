/**
 * 定向验证上一轮全量遍历里记成 vanished 的按钮：
 *   [Chat] 选择角色 / + 添加模型   [Connectors] 编辑
 * 每个目标都先整页重载（goto 同 URL 会真重载，清掉 pinia 状态）再找，
 * 找到就点，记录点击前后的可观测信号（弹窗/URL/DOM 变更）。
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TARGETS = [
  { url: '/chat', name: '选择角色' },
  { url: '/chat', name: '+ 添加模型' },
  { url: '/connectors', name: '编辑' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e.message).slice(0, 160)));
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  try { await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);

  for (const t of TARGETS) {
    errs.length = 0;
    await page.goto(BASE + t.url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
    await sleep(5000);

    const found = await page.evaluate((name) => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const out = [];
      for (const el of document.querySelectorAll('button,[role="button"],div,span,a')) {
        if (norm(el.textContent).includes(name) || norm(el.getAttribute('aria-label')) === name) {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: String(el.className || '').slice(0, 60),
            w: Math.round(r.width), h: Math.round(r.height),
            exact: norm(el.textContent) === name || norm(el.getAttribute('aria-label')) === name,
          });
          if (out.length >= 6) break;
        }
      }
      return out;
    }, t.name);

    console.log(`\n[${t.name}] @ ${t.url}  命中 ${found.length}`);
    found.forEach((f) => console.log('   ' + JSON.stringify(f)));
    if (!found.length) { console.log('   -> 不存在（需查为何不渲染）'); continue; }

    // 取最精确（文本完全相等）且最小的那个作为点击目标
    const pick = found.filter((f) => f.exact).sort((a, b) => a.w * a.h - b.w * b.h)[0] || found[found.length - 1];
    const overlayBefore = await page.evaluate(() => document.querySelectorAll('[role="dialog"],.el-overlay,.el-drawer').length);
    await page.evaluate(() => {
      window.__vMut = { n: 0 };
      new MutationObserver((m) => { window.__vMut.n += m.length; })
        .observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    });
    const urlBefore = page.url();
    const loc = page.locator(
      `button:has-text(${JSON.stringify(t.name)}),[role="button"]:has-text(${JSON.stringify(t.name)}),`
      + `div:has-text(${JSON.stringify(t.name)}),span:has-text(${JSON.stringify(t.name)})`,
    ).last();
    let clickErr = '';
    try {
      await loc.first().click({ timeout: 6000, noWaitAfter: true });
    } catch (e) {
      clickErr = String(e.message).split('\n').filter((x) => /not stable|intercepts|not visible|not enabled|detached/i.test(x))[0] || 'click失败';
      try {
        await loc.first().click({ timeout: 5000, force: true, noWaitAfter: true });
        clickErr += ' (force成功)';
      } catch (e2) { clickErr += ' + force也失败: ' + String(e2.message).split('\n')[0].slice(0, 80); }
    }
    await sleep(1800);
    const overlayAfter = await page.evaluate(() => document.querySelectorAll('[role="dialog"],.el-overlay,.el-drawer').length);
    const muts = await page.evaluate(() => (window.__vMut ? window.__vMut.n : -1)).catch(() => -2);
    const urlAfter = page.url();
    const toasts = await page.locator('.el-message, .re-toast, .el-notification').allInnerTexts().catch(() => []);
    console.log(`   点击: ${clickErr || '成功'} | 弹窗 ${overlayBefore}->${overlayAfter} | DOM变更 ${muts} | URL变=${urlAfter !== urlBefore} (${urlAfter.replace(BASE, '')}) | toast=${JSON.stringify(toasts.slice(0, 2))}`);
    if (errs.length) console.log('   错误: ' + errs.join(' | '));
    if (overlayAfter > overlayBefore || muts > 0 || urlAfter !== urlBefore || toasts.length) {
      console.log('   -> 有效按钮（有可观测副作用）');
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(800);
    } else {
      console.log('   -> 需人工判：无任何可观测副作用');
    }
  }
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
