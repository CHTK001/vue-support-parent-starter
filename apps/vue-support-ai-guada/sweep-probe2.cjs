const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e.message).slice(0, 200)));
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 120)); });
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  try { await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);
  for (const u of ['/agents', '/skills']) {
    errs.length = 0;
    await page.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
    await sleep(9000);
    const info = await page.evaluate(() => ({
      url: location.href,
      btns: document.querySelectorAll('button').length,
      roles: document.querySelectorAll('[role="button"]').length,
      bodyLen: document.body.innerText.length,
      head: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200),
    })).catch((e) => ({ evalFail: String(e.message).split('\n')[0].slice(0, 120) }));
    console.log(u + ' -> ' + JSON.stringify(info));
    console.log('  errs: ' + (errs.length ? errs.slice(0, 6).join(' | ') : '(none)'));
  }
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
