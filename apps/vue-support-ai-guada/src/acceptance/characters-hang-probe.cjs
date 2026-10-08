/**
 * 定性 /characters 路由为何 240s 采不到：
 *   - 是页面/接口真卡住，还是只是慢？
 *   - 记录：到达可交互的耗时、未完成请求、控制台错误、页面文本样本
 * 用法：BASE=http://localhost:15689 node src/acceptance/characters-hang-probe.cjs
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:15689';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  const pending = new Map();
  const failed = [];
  const errs = [];
  page.on('request', (r) => pending.set(r.url(), Date.now()));
  page.on('requestfinished', (r) => pending.delete(r.url()));
  page.on('requestfailed', (r) => { pending.delete(r.url()); failed.push(`FAIL ${r.failure()?.errorText} ${r.url().slice(0, 120)}`); });
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(0, 120)}`); });
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 140)); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 140)));

  // 登录
  const body = await page.request.post(BASE + '/v2/user/login', { data: { username: USER, password: PASS }, timeout: 30000 }).then((r) => r.json());
  const tk = body?.data?.accessToken || '';
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(([t, u]) => {
    localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
    localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
  }, [tk, USER]);

  const t0 = Date.now();
  await page.goto(BASE + '/characters', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const tDom = Date.now() - t0;

  // 等"可交互"：出现任一常见容器，或超时
  let readyMs = -1;
  try {
    await page.waitForFunction(() => {
      const sels = ['.page-header', '.character-card', '.el-card', 'main', '.app-main', '.sidebar'];
      return sels.some((s) => document.querySelector(s));
    }, { timeout: 90000 });
    readyMs = Date.now() - t0;
  } catch { readyMs = -1; }

  const info = await page.evaluate(() => ({
    url: location.pathname,
    text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
    cards: document.querySelectorAll('.character-card, .el-card').length,
  }));

  console.log(`DOMContentLoaded=${tDom}ms  可交互=${readyMs}ms (=-1 表示 90s 内未出现)`);
  console.log('页面:', JSON.stringify(info));
  const still = [...pending.keys()].map((u) => u.slice(0, 120));
  console.log('仍在进行中的请求(' + still.length + '):', JSON.stringify(still.slice(0, 8)));
  console.log('失败/4xx5xx(' + failed.length + '):', JSON.stringify(failed.slice(0, 8)));
  console.log('控制台错误(' + errs.length + '):', JSON.stringify(errs.slice(0, 4)));
  await browser.close();
  console.log(readyMs > 0 ? 'RESULT=READY' : 'RESULT=HANG_OR_SLOW');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
