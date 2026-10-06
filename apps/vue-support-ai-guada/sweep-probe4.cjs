const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  try { await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);
  for (const u of ['/agents', '/skills']) {
    await page.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
    await sleep(9000);
    const info = await page.evaluate(() => {
      const sel = 'button,[role="button"],.el-button,.re-button,.rs-btn,a[href],.el-dropdown-menu__item,[class*="icon-btn"],[class*="iconBtn"]';
      const all = [...document.querySelectorAll(sel)];
      const sample = all.slice(0, 8).map((el) => {
        const r = el.getBoundingClientRect();
        return el.tagName + '.' + String(el.className || '').slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
      });
      const btns = [...document.querySelectorAll('button')].slice(0, 6).map((el) => {
        const r = el.getBoundingClientRect();
        return el.tagName + '.' + String(el.className || '').slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)
          + ' match=' + el.matches(sel);
      });
      return { url: location.href, selCount: all.length, sample, btns };
    }).catch((e) => ({ evalFail: String(e.message).split('\n')[0] }));
    console.log(u + ' selCount=' + info.selCount + ' url=' + (info.url || '').replace(BASE, ''));
    (info.sample || []).forEach((s) => console.log('  SEL ' + s));
    (info.btns || []).forEach((s) => console.log('  BTN ' + s));
  }
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
