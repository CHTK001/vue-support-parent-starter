/**
 * 验证：2.3 分叉 UI、2.2 到底按钮（后端刚重启完成，dev=15689 已就绪）
 *   用法：BASE=http://localhost:15689 node src/acceptance/fork-scroll-probe.cjs
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:15689';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';
const SID = process.env.SID || '74';

const checks = [];
const add = (n, ok, d) => { checks.push({ n, ok: !!ok, d: String(d ?? '') }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n} :: ${d}`); };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  const errs = [];
  const reqs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('response', (r) => { if (/\/fork|\/workspace\/file/.test(r.url())) reqs.push(r.status() + ' ' + r.url().replace(BASE, '').slice(0, 90)); });

  // 登录（令牌注入）
  const body = await page.request.post(BASE + '/v2/user/login', { data: { username: USER, password: PASS }, timeout: 30000 }).then((r) => r.json());
  const tk = body?.data?.accessToken || '';
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(([t, u]) => {
    localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
    localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
  }, [tk, USER]);

  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('button.model-selector-btn', { timeout: 180000 });
  await page.waitForTimeout(6000);

  // ── 2.3 分叉：悬停助手消息 → 点分叉 ──
  const forkBtn = page.locator('[aria-label*="分叉"], [title*="分叉"], [aria-label*="Fork"]').first();
  const hasFork = await forkBtn.count() > 0;
  add('fork.buttonPresent', hasFork, 'count=' + (await forkBtn.count()));
  if (hasFork) {
    try { await forkBtn.hover({ timeout: 4000 }); } catch {}
    await forkBtn.click({ force: true, timeout: 8000 }).catch((e) => console.log('INFO fork click err:', String(e).slice(0, 80)));
    await page.waitForTimeout(6000);
  }
  const forkResp = reqs.filter((x) => /\/fork/.test(x));
  add('fork.request200', forkResp.some((x) => x.startsWith('200')), JSON.stringify(forkResp.slice(0, 3)));

  // ── 2.2 到底按钮：滚动到底部后应隐藏 ──
  const scroller = page.locator('.scroll-container, [class*="scroll"]').first();
  if (await scroller.count() > 0) {
    await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(800);
    const btn = page.locator('.scroll-to-bottom, [class*="scroll-to-bottom"], [aria-label*="底部"]').first();
    const visible = (await btn.count()) > 0 ? await btn.isVisible().catch(() => false) : false;
    add('scrollBtn.hiddenAtBottom', !visible, 'visible=' + visible + ' btnCount=' + (await btn.count()));
  } else {
    add('scrollBtn.scrollerFound', false, 'no scroller element');
  }

  add('noPageErrors', errs.length === 0, JSON.stringify(errs.slice(0, 3)));
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== fork-scroll-probe: ${checks.length - failed.length}/${checks.length} PASS =====`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
