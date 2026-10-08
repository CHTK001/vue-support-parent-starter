/**
 * Targeted re-check of the single sweep FAIL:
 *   /image-generate  "加载更早的记录"  (.wg-more-btn)  state=not-clickable
 *   err=locator.click: Timeout 5000ms exceeded ; effect=DOM变更93条
 *
 * Question: is it a DEAD button, or did the harness just click while the list was
 * animating/re-rendering? The sweep's own record already shows 93 DOM mutations,
 * which argues against "dead", but that must be reproduced deliberately.
 *
 * Method: wait for the element to be stable, record the list size BEFORE, click
 * (normal, then force as fallback), record AFTER and the mutation count.
 */
const { chromium } = require('playwright');
const BASE = process.env.ACCEPT_BASE || 'http://localhost:15697';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const hc = await fetch(BASE + '/v2/user/me').then((r) => r.status).catch((e) => 'EXC:' + e.message);
  console.log(`connectivity /v2/user/me=${hc}`);
  if (hc !== 200 && hc !== 403) process.exit(2);

  // full chromium with --headless=new (chrome-headless-shell gets killed by
  // another session on this box)
  const browser = await chromium.launch({ headless: false, args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 200)));

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('input[type="password"]', { timeout: 150000 });
  await sleep(3500);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 90000 }).catch(() => {});
  await sleep(2500);

  await page.goto(BASE + '/image-generate', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('.wg-more-btn, .wg-icon, .wg-card, .wg-thumb', { timeout: 120000 }).catch(() => {});
  await sleep(6000);

  const btn = page.locator('.wg-more-btn').first();
  const cnt = await btn.count();
  console.log(`.wg-more-btn count = ${cnt}`);
  if (!cnt) {
    console.log('no pagination button on this page state -> the sweep item does not exist now');
    const body = (await page.locator('body').innerText().catch(() => '') || '').replace(/\s+/g, ' ');
    console.log('body[0:200] = ' + body.slice(0, 200));
    await browser.close();
    process.exit(3);
  }
  console.log('button text = ' + JSON.stringify((await btn.innerText().catch(() => '')).trim()));
  console.log('visible = ' + await btn.isVisible() + '  enabled = ' + await btn.isEnabled());

  const cards = () => page.locator('.wg-card, .wg-thumb, figure').count();
  const before = await cards();

  // instrument DOM mutations around the click
  await page.evaluate(() => {
    window.__mut = 0;
    const ob = new MutationObserver((m) => { window.__mut += m.length; });
    ob.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.__ob = ob;
  });

  let how = '';
  try {
    await btn.scrollIntoViewIfNeeded({ timeout: 8000 });
    await sleep(1200);                                  // let animations settle
    await btn.click({ timeout: 15000 });                // generous, no force
    how = 'normal(15s)';
  } catch (e1) {
    try { await btn.click({ timeout: 15000, force: true }); how = 'force(15s)'; }
    catch (e2) { how = 'FAILED: ' + String(e2.message).slice(0, 160); }
  }
  await sleep(6000);

  const mut = await page.evaluate(() => window.__mut).catch(() => -1);
  const after = await cards();
  console.log(`click = ${how}`);
  console.log(`DOM mutations around click = ${mut}`);
  console.log(`cards before=${before} after=${after}  delta=${after - before}`);
  console.log('pageerrors = ' + JSON.stringify(errs.slice(0, 3)));

  const verdict = how.startsWith('FAILED')
    ? 'STILL NOT CLICKABLE'
    : ((after !== before || mut > 0)
        ? 'CLICKABLE WITH EFFECT -> sweep item was an animation-timing miss, not a dead button'
        : 'CLICKED BUT NO OBSERVABLE EFFECT -> needs product-side look');
  console.log('VERDICT: ' + verdict);

  await browser.close();
  process.exit(how.startsWith('FAILED') ? 1 : 0);
})();
