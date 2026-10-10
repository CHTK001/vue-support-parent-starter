/**
 * 复现验收：#5「重新生成/生成过程中刷新页面，AI 回复数据没了」。
 *
 * 复现路径（与用户一致）：
 *   1. 进入会话 -> 发送一条消息，等生成真正开始（后端 isRunning=true）
 *   2. **立刻刷新页面**（模拟用户刷新）
 *   3. 期望：回复不会凭空消失 —— 刷新后助手回复仍会出现（subscribe 重连把增量接住；
 *      后端本身不依赖客户端，实验已证 3 秒掐断后仍会落库）
 *
 * 用法：BASE=http://localhost:15689 node src/acceptance/refresh-stream-probe.cjs
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
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  // 登录（令牌注入，见 regen-suggestion-probe 同款说明）
  const body = await page.request.post(BASE + '/v2/user/login', { data: { username: USER, password: PASS }, timeout: 30000 }).then((r) => r.json());
  const tk = body?.data?.accessToken || '';
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(([t, u]) => {
    localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
    localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
  }, [tk, USER]);

  const status = async () => {
    const r = await page.request.get(`${BASE}/v2/chat/stream/${SID}/status`, { headers: { Authorization: 'Bearer ' + tk }, timeout: 20000 });
    return await r.json().catch(() => ({}));
  };
  const msgs = async () => {
    const r = await page.request.get(`${BASE}/v2/sessions/${SID}/messages`, { headers: { Authorization: 'Bearer ' + tk }, timeout: 25000 });
    const b = await r.json().catch(() => ({}));
    const items = b?.data?.items || b?.data || [];
    return Array.isArray(items) ? items : [];
  };

  await page.goto(`${BASE}/chat/${SID}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('button.model-selector-btn', { timeout: 180000 });
  await page.waitForTimeout(4000);

  // 发送一条会持续一会儿的消息
  const editor = page.locator('[contenteditable="true"], textarea').first();
  await editor.click();
  await editor.type('请写一段 200 字以上的介绍，专门用于刷新测试。', { delay: 12 });
  await page.waitForTimeout(300);
  const send = page.locator('button.send-btn').first();
  const canSend = await send.count() > 0 && !(await send.isDisabled().catch(() => true));
  add('send.enabled', canSend, 'canSend=' + canSend);
  await send.click();
  await page.waitForTimeout(2500);

  const st = await status();
  const running = !!st?.data?.isRunning;
  add('stream.runningBeforeReload', running, JSON.stringify(st?.data || {}));

  // —— 关键动作：生成中刷新 ——
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('button.model-selector-btn', { timeout: 180000 });
  await page.waitForTimeout(30000);   // 给重连/落库留时间

  // 页面上的助手文本长度（DOM 视角）
  const domText = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.message-item__card')];
    let best = '';
    for (const c of cards) {
      const t = (c.innerText || '').trim();
      if (!/message-item--user|message-item__user/.test(c.className) && t.length > best.length) best = t;
    }
    return best;
  });
  add('afterReload.assistantTextVisible', (domText || '').length > 20, 'len=' + (domText || '').length + ' head=' + JSON.stringify((domText || '').slice(0, 40)));

  const all = await msgs();
  const assistants = all.filter((m) => /assistant/i.test(String(m.role || m.type || '')));
  const lastText = String(assistants[assistants.length - 1]?.contents?.[0]?.content ?? '').trim();
  add('afterReload.persistedReply', lastText.length > 20, 'lastAssistantLen=' + lastText.length);

  add('noPageErrors', errs.length === 0, JSON.stringify(errs.slice(0, 2)));
  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== refresh-stream-probe: ${checks.length - failed.length}/${checks.length} PASS =====`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
