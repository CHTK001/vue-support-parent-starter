const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  let token = '';
  const onResp = async (r) => {
    if (token) return;
    if (/\/v2\/user\/login/.test(r.url()) && r.request().method() === 'POST') {
      try { token = JSON.parse(await r.text())?.data?.accessToken || ''; } catch {}
    }
  };
  page.on('response', onResp);
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1800);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  try { await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);
  page.off('response', onResp);
  console.log('token=' + (token ? 'YES' : 'NO'));
  const urls = ['/characters', '/bots', '/tavern', '/setting', '/plugins', '/knowledge-base', '/models', '/image-generate', '/roles'];
  for (const u of urls) {
    try {
      await page.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(8000);
      const info = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        bodyLen: document.body.innerText.length,
        btns: document.querySelectorAll('button').length,
        head: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160),
      }));
      console.log(u + ' -> ' + info.url.replace(BASE, '') + ' btns=' + info.btns + ' bodyLen=' + info.bodyLen + ' | ' + info.head);
    } catch (e) {
      console.log(u + ' GOTO-FAIL ' + String(e.message).split('\n')[0].slice(0, 120));
    }
  }
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
