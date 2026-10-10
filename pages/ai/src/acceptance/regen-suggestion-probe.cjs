/**
 * 复现验收：两个用户报障的缺陷（#1 AI 建议组件销毁 / #2 重新生成后切会话出现两行记录）。
 *
 * #1 期望：点任意一条 AI 建议 -> 整块 `.next-task` 组件**消失**（等同点 X），
 *          而不是只少一条建议。
 * #2 期望：对某条助手消息点「重新生成」-> 流式结束 -> 切到第一个会话再切回 ->
 *          会话里**不出现两条连续同文的用户消息**（此前 bug：multi_version 回放帧
 *          因 id 不同绕过去重，导致多出一行）。
 *
 * 用法：BASE=http://localhost:15689 node src/acceptance/regen-suggestion-probe.cjs
 * 说明：登录用接口取令牌注入 localStorage（绕开 dev 冷编译期的登录跳转）。
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:15689';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';
const SID = process.env.SID || '1';

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail == null ? '' : detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} :: ${detail}`);
};

async function login(page) {
  const resp = await page.request.post(BASE + '/v2/user/login', {
    data: { username: USER, password: PASS }, timeout: 30000,
  });
  const body = await resp.json().catch(() => ({}));
  const token = body?.data?.accessToken || '';
  if (!token) throw new Error('login api failed');
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(([t, u]) => {
    localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
    localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
  }, [token, USER]);
  return token;
}

/** 会话里连续的 user 消息文本（用于查重） */
const userTexts = (page) => page.$$eval('.message-item__card', (cards) => {
  const out = [];
  for (const c of cards) {
    const isUser = /message-item--user|message-item__user/.test(c.className)
      || !!c.querySelector('.message-item__user');
    if (!isUser) continue;
    const t = (c.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    out.push(t);
  }
  return out;
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 140)); });

  await login(page);

  // ── #1 AI 建议：点击后整块组件消失 ──
  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('button.model-selector-btn', { timeout: 180000 });
  await page.waitForTimeout(6000);   // 等建议加载（后端 ai-next-task）

  const panel = page.locator('.next-task');
  const panelBefore = await panel.count() ? await panel.first().isVisible() : false;
  console.log('INFO  next-task 初始可见 =', panelBefore);
  if (panelBefore) {
    // 真正的建议项是 .next-task__item-main（.next-task button 的第一个是「收起」按钮，点它会误判）
    const items = page.locator('.next-task__item-main');
    const n0 = await items.count();
    add('suggestion.panelVisibleBefore', n0 > 0, 'items=' + n0);
    await items.first().click();
    await page.waitForTimeout(2500);
    const stillVisible = (await page.locator('.next-task').count()) > 0
      && (await page.locator('.next-task').first().isVisible().catch(() => false));
    add('suggestion.componentDestroyedAfterPick', !stillVisible,
      'panelStillVisible=' + stillVisible);
  } else {
    add('suggestion.panelPresent', false, '会话无 AI 建议（换 SID 或先开启 AI 建议）');
  }

  // ── #2 重新生成：切会话/重载后不出现重复用户行（用接口作唯一事实来源，避开 DOM 类名） ──
  const tk = await page.request.post(BASE + '/v2/user/login', {
    data: { username: USER, password: PASS }, timeout: 30000,
  }).then((r) => r.json()).then((b) => b?.data?.accessToken || '').catch(() => '');
  const fetchMsgs = async () => {
    const r = await page.request.get(`${BASE}/v2/sessions/${SID}/messages`, {
      headers: { Authorization: 'Bearer ' + tk }, timeout: 30000,
    });
    const b = await r.json().catch(() => ({}));
    const items = b?.data?.items || b?.data || [];
    return (Array.isArray(items) ? items : []).map((m) => ({
      role: String(m.role || m.type || ''),
      text: String((m.contents?.[0]?.content) ?? m.content ?? '').trim(),
    }));
  };
  const dupUsers = (msgs) => {
    const users = msgs.filter((m) => /user/i.test(m.role));
    let dup = 0;
    for (let i = 1; i < users.length; i++) {
      if (users[i].text && users[i].text === users[i - 1].text) dup++;
    }
    return { users: users.length, dup };
  };

  const b0 = dupUsers(await fetchMsgs());
  console.log('INFO  token=' + tk.length + ' 重新生成前：user 行=' + b0.users + ' 相邻重复=' + b0.dup);

  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForTimeout(5000);
  const regen = page.locator('[aria-label*="重新生成"], [aria-label*="Regenerate"]').first();
  let clicked = false;
  if (await regen.count() > 0) {
    await regen.click({ force: true }).then(() => { clicked = true; }).catch(() => {});
    await page.waitForTimeout(15000);   // 等流式结束
  }
  // 复现用户路径：切走再切回（触发从后端重载）
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);

  const a0 = dupUsers(await fetchMsgs());
  console.log('INFO  重载后：user 行=' + a0.users + ' 相邻重复=' + a0.dup);
  add('regenerate.clicked', clicked, 'clicked=' + clicked);
  add('regenerate.noDuplicateUserRows', a0.dup === 0,
    `beforeUsers=${b0.users} afterUsers=${a0.users} dup=${a0.dup}`);

  add('noPageErrors', errs.length === 0, JSON.stringify(errs.slice(0, 3)));
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== regen-suggestion-probe: ${checks.length - failed.length}/${checks.length} PASS =====`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
