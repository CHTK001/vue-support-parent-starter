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
      const btns = [...document.querySelectorAll('button')].slice(0, 14).map((b) => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return JSON.stringify({
          t: (b.textContent || '').trim().slice(0, 18),
          w: Math.round(r.width), h: Math.round(r.height),
          d: cs.display, v: cs.visibility, o: cs.opacity,
          dis: b.disabled,
        });
      });
      return { url: location.href, n: document.querySelectorAll('button').length, btns };
    }).catch((e) => ({ evalFail: String(e.message).split('\n')[0] }));
    console.log(u + ' n=' + info.n);
    (info.btns || []).forEach((b) => console.log('  ' + b));
  }
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
