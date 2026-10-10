/**
 * 定向验收：AI 建议「发送即消费」。
 *
 * 复现用户报障：「ai建议发出去就不显示了，不能一直在」——点击一条建议发出后，
 * 该条必须从面板移除（若为最后一条，整块面板随之消失），而不是一直挂着。
 *
 * 只做只读+真实点击；对后端仅 PUT enabled=true + 必要时 POST refresh 以取得建议。
 */
const { chromium } = require('playwright');

const BASE = process.env.ACCEPT_BASE || 'http://localhost:15690';
const API = process.env.BACKEND || 'http://192.168.50.198:8787';
const SID = process.env.SID || '1';

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail == null ? '' : detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} :: ${detail}`);
};

(async () => {
  // ── 0) 后端准备：确保该会话开启联想且有建议 ───────────────────────────
  const lg = await fetch(API + '/v2/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'phone', username: 'admin', password: 'admin123' }),
  });
  const token = (await lg.json()).data.accessToken;
  const H = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  const put = await fetch(`${API}/v2/sessions/${SID}/ai-next-task`, {
    method: 'PUT', headers: H, body: JSON.stringify({ enabled: true }),
  });
  add('api.enable', put.status === 200, 'status=' + put.status);
  let st = (await put.json()).data || {};
  if (!(st.tasks || []).length) {
    const rf = await fetch(`${API}/v2/sessions/${SID}/ai-next-task/refresh`, { method: 'POST', headers: H });
    st = (await rf.json()).data || {};
    add('api.refresh', (st.tasks || []).length > 0,
      'tasks=' + (st.tasks || []).length + ' msg=' + String(st.message || '').slice(0, 60));
  }
  const apiTitles = (st.tasks || []).map((t) => t.title);
  add('api.tasksPresent', apiTitles.length > 0, JSON.stringify(apiTitles).slice(0, 180));
  if (!apiTitles.length) {
    console.log(JSON.stringify({ passed: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length, checks }, null, 1));
    process.exit(3);
  }

  // ── 1) 浏览器 ─────────────────────────────────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  const streams = [];
  page.on('request', (r) => { if (/\/v2\/chat\/stream/.test(r.url()) && r.method() === 'POST') streams.push(r.url()); });

  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 40000 });
  add('login', true, page.url());

  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.next-task', { timeout: 30000 }).catch(() => {});
  const panelVisible = await page.locator('.next-task').count();
  add('panel.visible', panelVisible > 0, 'panel=' + panelVisible);
  const before = await page.locator('.next-task__item').count();
  add('panel.items.before', before > 0, 'items=' + before);
  if (!before) {
    await browser.close();
    console.log(JSON.stringify({ passed: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length, checks }, null, 1));
    process.exit(3);
  }
  const firstTitle = ((await page.locator('.next-task__item-main').first().textContent()) || '').trim().replace(/\s+/g, ' ');
  const cardsBefore = await page.locator('.message-item__card').count();

  // ── 2) 点击第一条建议 ─────────────────────────────────────────────────
  await page.locator('.next-task__item-main').first().click({ timeout: 10000 });
  await page.waitForTimeout(2000);
  const after = await page.locator('.next-task__item').count();
  const panelAfter = await page.locator('.next-task').count();
  const remainingTitles = (await page.locator('.next-task__item-main').allTextContents()).map((x) => x.trim().replace(/\s+/g, ' '));
  const stillThere = remainingTitles.includes(firstTitle);
  const cardsAfter = await page.locator('.message-item__card').count();

  add('consume.itemRemoved', after === before - 1, `items ${before} -> ${after}`);
  add('consume.clickedGone', !stillThere,
    `clicked="${firstTitle.slice(0, 40)}" remaining=${JSON.stringify(remainingTitles.map((x) => x.slice(0, 24)))}`);
  add('consume.panelHidesWhenEmpty', after > 0 ? panelAfter > 0 : panelAfter === 0, `after=${after} panel=${panelAfter}`);
  add('send.attempted', streams.length > 0 || cardsAfter > cardsBefore,
    `streamReqs=${streams.length} cards ${cardsBefore} -> ${cardsAfter}`);
  // 「移除」的直接收益：该条不再可点，因此不会重复发送
  add('send.onceOnly', streams.length <= 1, `streamReqs=${streams.length}`);

  await page.waitForTimeout(1500);
  const failed = checks.filter((c) => !c.ok).length;
  console.log(JSON.stringify({ passed: checks.length - failed, failed, checks }, null, 1));
  await browser.close();
  process.exit(failed ? 3 : 0);
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(3); });
