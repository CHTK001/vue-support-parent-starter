/** 验证「选择角色」：新建会话态（/chat/new-session）下的角色 chip 是否点得动 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await (await b.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await p.locator('input[type="text"]').first().fill('admin');
  await p.locator('input[type="password"]').first().fill('admin123');
  await p.locator('button:has-text("登")').first().click();
  try { await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);

  await p.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await sleep(6000);
  const hit = await p.evaluate(() => {
    const n = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const out = [];
    for (const el of document.querySelectorAll('button,[role="button"],div,span')) {
      if (n(el.textContent) === '选择角色' || n(el.getAttribute('title')) === '选择角色') {
        const r = el.getBoundingClientRect();
        if (r.width >= 2 && r.height >= 2) {
          out.push({ tag: el.tagName, cls: String(el.getAttribute('class') || '').slice(0, 50),
            w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
    }
    return out;
  });
  console.log('URL=' + p.url().replace(BASE, '') + ' 命中=' + JSON.stringify(hit));
  if (!hit.length) {
    // 已有角色时 chip 显示角色名（如「通用助手」）而不是「选择角色」——
    // 同一个 character-chip 的两个 v-if/v-else 分支，点它验证功能等价
    const chip = p.locator('.character-chip');
    const n = await chip.count();
    console.log('.character-chip 数量=' + n + (n ? ' 文案=' + JSON.stringify((await chip.first().innerText()).trim().slice(0, 30)) : ''));
    if (n) {
      const before = p.url();
      await chip.first().click({ timeout: 6000 }).catch(async (e) => {
        console.log('  普通点击失败，force: ' + String(e.message).split('\n')[0].slice(0, 80));
        await chip.first().click({ timeout: 5000, force: true }).catch(() => {});
      });
      await sleep(2500);
      console.log('点击后 URL=' + p.url().replace(BASE, '') + ' 跳转=' + (p.url() !== before)
        + ' | 页面含角色列表=' + /角色/.test(await p.evaluate(() => document.body.innerText.slice(0, 600))));
    }
    await b.close();
    return;
  }
  if (hit.length) {
    const before = p.url();
    let err = '';
    try {
      await p.locator('button:has-text("选择角色"),span:has-text("选择角色")').first().click({ timeout: 6000 });
    } catch (e) {
      err = String(e.message).split('\n').filter((x) => /not stable|intercepts|not visible|detached/i.test(x))[0] || 'click失败';
      try { await p.locator('button:has-text("选择角色"),span:has-text("选择角色")').first().click({ timeout: 5000, force: true }); err += ' (force成功)'; }
      catch (e2) { err += ' force也失败:' + String(e2.message).split('\n')[0].slice(0, 80); }
    }
    await sleep(2500);
    console.log('点击: ' + (err || '成功') + ' | URL=' + p.url().replace(BASE, '') + ' 跳转=' + (p.url() !== before)
      + ' | 角色页出现=' + /角色|character/i.test(await p.evaluate(() => document.body.innerText.slice(0, 400))));
  } else {
    const body = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
    console.log('未命中，页面文本: ' + body);
  }
  await b.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
