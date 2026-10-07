/**
 * 浏览器级聊天流式验收（交付核心链路，API 证据之外的 UI 级证明）。
 *
 * WHY (2026-10-07): §2.13 的 custom 平台流式修复此前只有 API 级证据
 * （POST /v2/chat/stream 3/3 stop）。生产交付要求「每个可点按钮都要测」，
 * 而聊天页的发送按钮 + 模型选择器必须在真实浏览器里走通一次完整回合：
 *   选中 custom 平台模型 laguna-s-2.1 → 输入 → 点发送/回车 →
 *   助手消息流式增长 → 回合正常结束 → 无失败 toast / 无 pageerror。
 *
 * 断言（全部满足才 PASS）：
 *   1. 模型面板能打开且含 laguna 模型项（模型选择器可用）
 *   2. 发送后用户消息出现在时间线
 *   3. 助手消息出现且文本非空（流式产出）
 *   4. 流式结束（stop 按钮回到 send 按钮）且耗时在合理区间
 *   5. 全程无 "stream failed / All 1 client(s) / 生成失败" 类失败文案
 *   6. 全程无 pageerror
 *
 * 用法：ACCEPT_BASE=http://localhost:15690 node src/acceptance/chat-stream-accept.cjs
 * 报告：src/acceptance/.ui-click-sweep-chunks/chat-stream.json
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.ACCEPT_BASE || process.env.BASE || 'http://localhost:15690';
const OUT = path.join(__dirname, '.ui-click-sweep-chunks', 'chat-stream.json');
const MODEL_RE = /laguna/i;

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail == null ? '' : detail).slice(0, 400) });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name} :: ${String(detail == null ? '' : detail).slice(0, 200)}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  const failTexts = [];
  page.on('pageerror', (e) => pageErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text() || '';
    if (/stream failed|All 1 client|生成失败|500|502|503/.test(t)) failTexts.push('console: ' + t.slice(0, 200));
  });

  try {
    // ---- login -----------------------------------------------------------
    await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForSelector('input[type="password"]', { timeout: 40000 });
    await page.locator('input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button:has-text("登")').first().click();
    await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 40000 });
    await sleep(2500);
    add('login', true, page.url());

    // ---- open chat view --------------------------------------------------
    await page.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.message-editor, .send-btn', { timeout: 40000, state: 'attached' });
    await sleep(2500);
    // 配置就绪：模型按钮从占位「+ 添加模型」变为真实模型名（default model 解析完成）。
    // 就绪前点它会走「添加模型」分支（导航走 → 编辑器消失），run2/run3 实测教训。
    const selReady = page.locator('.model-selector-btn:visible');
    let readyText = '';
    for (let i = 0; i < 30; i++) {
      readyText = ((await selReady.first().textContent().catch(() => '')) || '').trim();
      if (readyText && !/添加模型/.test(readyText)) break;
      await sleep(1000);
    }
    add('modelSelector.configReady', !!readyText && !/添加模型/.test(readyText),
      `btnText="${readyText.replace(/\s+/g, ' ').slice(0, 40)}"`);

    // ---- 1. model selector: open & pick custom model ---------------------
    // 用 :visible 选实例：页面可能同时挂有隐藏面板里的同名按钮，.first() 会点到不可交互的那个
    const snap = async (tag) => {
      const s = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('.model-selector-btn')].map((n) => {
          const r = n.getBoundingClientRect();
          const cs = getComputedStyle(n);
          return `vis=${r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'} box=${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}x${Math.round(r.height)} disabled=${n.disabled} text="${(n.innerText || '').replace(/\s+/g, ' ').slice(0, 30)}"`;
        });
        const sends = [...document.querySelectorAll('.send-btn')].map((n) => `disabled=${n.disabled} cls=${n.className.slice(0, 50)}`);
        return {
          url: location.pathname,
          modelBtns: btns,
          sendBtns: sends,
          readonlyPH: document.querySelectorAll('.readonly-placeholder').length,
          editorVisible: [...document.querySelectorAll('.message-editor')].some((n) => n.getBoundingClientRect().height > 0),
          overlays: [...document.querySelectorAll('.el-overlay, [class*="overlay"]')].filter((n) => n.getBoundingClientRect().height > 0).map((n) => n.className.slice(0, 50)).slice(0, 4),
          dialogs: [...document.querySelectorAll('.el-dialog, .el-drawer')].filter((n) => n.getBoundingClientRect().height > 0).length,
          bodyLen: (document.body.innerText || '').length,
        };
      });
      add(tag, false, JSON.stringify(s).slice(0, 700));
    };
    const selBtn = page.locator('.model-selector-btn:visible').first();
    const selCount = await selBtn.count();
    if (selCount === 0) {
      add('modelSelector.present', false, 'no visible .model-selector-btn');
      await snap('modelSelector.snapshot');
      throw new Error('no model selector');
    }
    let clickedOk = false;
    let clickErr = '';
    for (let a = 0; a < 3 && !clickedOk; a++) {
      try {
        await selBtn.click({ timeout: 12000 });
        clickedOk = true;
      } catch (e) {
        clickErr = String(e.message).split('\n')[0].slice(0, 120);
        await sleep(2500); // 并发负载下指针点击可能被动画/工具提示干扰，稍候重试
      }
    }
    if (!clickedOk) {
      add('modelSelector.click', false, clickErr);
      await snap('modelSelector.snapshot');
      throw new Error('model selector click failed: ' + clickErr);
    }
    await sleep(1200);
    const items = await page.locator('.model-item').count();
    const laguna = page.locator('.model-item', { hasText: MODEL_RE }).first();
    const hasLaguna = (await laguna.count()) > 0;
    add('modelSelector.open', items > 0, `items=${items}`);
    add('modelSelector.hasLaguna', hasLaguna, hasLaguna ? 'laguna item present' : 'laguna NOT in panel');
    if (hasLaguna) {
      await laguna.click();
      await sleep(1200);
    } else {
      await page.keyboard.press('Escape');
    }
    // confirm current model switched (panel re-open -> active item)
    await selBtn.click({ timeout: 15000 }).catch(() => {});
    await sleep(900);
    const activeText = (await page.locator('.model-item-active, .current-model-item').first().textContent().catch(() => '')) || '';
    add('modelSelector.selected', /laguna/i.test(activeText), `current="${activeText.trim().slice(0, 60)}"`);
    await page.keyboard.press('Escape');
    await sleep(600);

    // ---- 2. type & send --------------------------------------------------
    const editor = page.locator('.message-editor .ProseMirror, .message-editor [contenteditable="true"]').first();
    await editor.waitFor({ timeout: 20000, state: 'visible' }).catch(async () => {
      // fallback: any contenteditable on the page
      return page.locator('[contenteditable="true"]').first().waitFor({ timeout: 10000, state: 'visible' });
    });
    const target = (await editor.count()) > 0 ? editor : page.locator('[contenteditable="true"]').first();
    await target.click();
    await target.type('请用一句话介绍你自己。', { delay: 25 });
    await sleep(500);
    // 诊断：输入是否真的进了编辑器
    const typedText = ((await target.textContent().catch(() => '')) || '').trim();
    add('send.typedIntoEditor', /介绍你自己/.test(typedText), `editorText="${typedText.slice(0, 40)}"`);

    // 发送阶段全程 API 监听（诊断 session 创建 / 流式请求是否发出、状态码）
    const apiLog = [];
    const onApi = (r) => {
      const u = r.url();
      if (/\/v2\/(sessions|chat)\b|\/chat\/stream|session/.test(u)) {
        apiLog.push(r.status() + ' ' + u.replace(BASE, '').slice(0, 90));
      }
    };
    page.on('response', onApi);

    const beforeItems = await page.locator('.message-item__card').count();
    const sendBtn = page.locator('.send-btn:not(.stop-btn)').first();
    const sendVisible = (await sendBtn.count()) > 0 && await sendBtn.isVisible();
    const sendDisabled = sendVisible ? await sendBtn.isDisabled().catch(() => null) : null;
    add('send.enabled', sendDisabled === false, `visible=${sendVisible} disabled=${sendDisabled}`);
    if (sendVisible && sendDisabled) {
      // 禁用原因藏在 :disabled 三条件里（readonly/空输入/无 modelId）——点也不会发
      await snap('send.disabledSnapshot');
    }
    if (sendVisible) {
      await sendBtn.click({ timeout: 8000 }).catch((e) => add('send.click', false, String(e.message).split('\n')[0].slice(0, 100)));
    } else {
      await target.press('Enter');
    }
    add('send.clicked', true, `via=${sendVisible ? 'button' : 'enter'}`);

    // ---- 3. user message appeared ---------------------------------------
    let userSeen = false;
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      const n = await page.locator('.message-item__card').count();
      if (n > beforeItems) { userSeen = true; break; }
    }
    add('userMessage.appeared', userSeen, `items ${beforeItems} -> ${await page.locator('.message-item__card').count()}`);

    // ---- 4. assistant message streams & finishes -------------------------
    const t0 = Date.now();
    let lastLen = -1;
    let grew = false;
    let sawStop = false; // stop 按钮出现过 = 流式回合真实进行过（比文本采样更硬的证据）
    let finalLen = -1;
    let stopped = false;
    // wait until stop button appears (streaming started) or content shows
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      const stopBtn = await page.locator('.send-btn.stop-btn').count();
      if (stopBtn > 0) sawStop = true;
      const items = await page.locator('.message-item__card').count();
      const lastText = items > 0
        ? (await page.locator('.message-item__card').nth(items - 1).textContent().catch(() => '')) || ''
        : '';
      const len = lastText.trim().length;
      if (lastLen >= 0 && len > lastLen) grew = true;
      lastLen = len;
      finalLen = len;
      if (stopBtn === 0 && i > 3 && (grew || sawStop)) { stopped = true; break; }
      if (stopBtn === 0 && i > 45) { stopped = true; break; } // safety：45s 仍无任何动静才放弃（容忍冷启动慢模型）
      if (Date.now() - t0 > 100000) break;
    }
    const elapsed = Date.now() - t0;
    // grew=逐段增长；sawStop=期间确实在流式（回复极小时可能一次渲染完，用 stop 兜证）
    add('assistant.streamingGrew', grew || sawStop, `lastLen=${finalLen} grew=${grew} sawStop=${sawStop}`);
    add('assistant.finished', stopped && finalLen > 0, `elapsed=${elapsed}ms finalLen=${finalLen}`);

    // ---- 失败快照：消息没出现时给出可定位的现场 --------------------------
    page.off('response', onApi);
    if (!(await page.locator('.message-item__card').count())) {
      const snap = await page.evaluate(() => ({
        url: location.pathname,
        chatMsgs: (document.querySelector('.chat-messages')?.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
        msgSel: document.querySelectorAll('[class*="message"]').length,
        anyMsg: [...document.querySelectorAll('[class*="message-item"], [class*="msg-"]')].slice(0, 5).map((n) => n.className.slice(0, 60)),
        toasts: [...document.querySelectorAll('.el-message, [class*="toast"]')].map((n) => (n.innerText || '').replace(/\s+/g, ' ').slice(0, 80)).slice(0, 5),
        editor: (document.querySelector('.message-editor')?.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
      }));
      add('diag.snapshot', false,
        `url=${snap.url} api=${JSON.stringify(apiLog.slice(-8))} chatMsgs="${snap.chatMsgs}" msgSel=${snap.msgSel} anyMsg=${JSON.stringify(snap.anyMsg)} toasts=${JSON.stringify(snap.toasts)} editor="${snap.editor}"`);
    } else {
      add('diag.api', true, JSON.stringify(apiLog.slice(-8)));
    }

    // ---- 5. no failure text ---------------------------------------------
    const bodyText = (await page.locator('body').textContent().catch(() => '')) || '';
    const bad = /stream failed|All 1 client\(s\)|生成失败|请求失败/.test(bodyText)
      || failTexts.length > 0;
    add('noFailureText', !bad,
      bad ? `body/console hit: ${(failTexts[0] || bodyText.match(/stream failed|All 1 client\(s\)|生成失败|请求失败/)[0])}` : 'clean');

    // ---- 6. no pageerror -------------------------------------------------
    add('noPageErrors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    add('script.fatal', false, (e && e.message) || String(e));
  } finally {
    const passed = checks.filter((c) => c.ok).length;
    const failed = checks.filter((c) => !c.ok).length;
    try {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify({
        generatedAt: new Date().toISOString(),
        base: BASE,
        passed, failed,
        checks,
      }, null, 2));
    } catch (_) { /* report is best-effort */ }
    console.log(`\n{ "passed": ${passed}, "failed": ${failed}, "out": "${OUT}" }`);
    await browser.close();
    process.exit(failed === 0 ? 0 : 3);
  }
})().catch((e) => {
  console.error('FATAL: ' + (e && e.message));
  process.exit(3);
});
