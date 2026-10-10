/**
 * 2.2 强化验证：**流式期间**滚到底，流式结束后按钮不应存在（真实类名 .scroll-to-bottom-btn）
 * 用法：BASE=http://localhost:15689 node src/acceptance/scrollbtn-stream-probe.cjs
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
  const body = await page.request.post(BASE + '/v2/user/login', { data: { username: USER, password: PASS }, timeout: 30000 }).then((r) => r.json());
  const tk = body?.data?.accessToken || '';
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(([t, u]) => {
    localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
    localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
  }, [tk, USER]);

  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('button.model-selector-btn', { timeout: 180000 });
  await page.waitForTimeout(4000);

  // 发一条消息触发流式
  const editor = page.locator('[contenteditable="true"], textarea').first();
  await editor.click();
  await editor.type('请写一段 120 字左右的说明，用于到底按钮测试。', { delay: 10 });
  await page.waitForTimeout(300);
  await page.locator('button.send-btn').first().click();
  await page.waitForTimeout(2500);

  // 流式期间把它滚到底
  await page.evaluate(() => {
    const el = document.querySelector('.scroll-container, [class*="scroll"]');
    if (el) { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event('scroll')); }
  });
  await page.waitForTimeout(500);
  const during = await page.locator('.scroll-to-bottom-btn').count();
  console.log('INFO 流式中滚到底后 btnCount=' + during);

  // 等流式结束
  await page.waitForTimeout(20000);
  await page.evaluate(() => {
    const el = document.querySelector('.scroll-container, [class*="scroll"]');
    if (el) { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event('scroll')); }
  });
  await page.waitForTimeout(1500);
  const after = await page.locator('.scroll-to-bottom-btn').count();
  const vis = after > 0 ? await page.locator('.scroll-to-bottom-btn').first().isVisible().catch(() => false) : false;
  add('scrollBtn.notRenderedAtBottomAfterStream', after === 0 || vis === false, `count=${after} visible=${vis}`);
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== scrollbtn-stream-probe: ${checks.length - failed.length}/${checks.length} PASS =====`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
