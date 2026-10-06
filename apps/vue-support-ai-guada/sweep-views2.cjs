/**
 * 定向验证上一轮全量遍历记成 vanished 的三个控件 —— 它们都是**状态相关**渲染：
 *   1) 「选择角色」：只在无主会话的新建面板（ChatPage v-else 分支）渲染
 *      → 先点「新会话」切到新建态再点它，期望跳到角色页
 *   2) 「+ 添加模型」：模型选择按钮在无模型时显示该文案，有模型时显示模型名
 *      → 点模型选择按钮本体，期望打开 ModelSelectorPanel
 *   3) 「编辑」：title="编辑" 的图标按钮（上个探针没查 title 属性才误判不存在）
 *      → 点它，期望弹出「编辑连接器」对话框
 */
const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  try { await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);
}

const overlayCount = (p) => p.evaluate(() => document.querySelectorAll(
  '[role="dialog"],.el-overlay,.el-drawer,[class*="dialog"] [class*="visible"]',
).length).catch(() => -1);

/** 在页面上按「文本或 title 或 aria-label」找元素（title 也纳入，图标按钮全靠它） */
const findByAnyName = (name) => `(() => {
  const n = ${JSON.stringify(name)};
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const out = [];
  for (const el of document.querySelectorAll('button,[role="button"],div,span,a')) {
    const hit = norm(el.textContent) === n || norm(el.getAttribute('aria-label')) === n
      || norm(el.getAttribute('title')) === n;
    if (!hit) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    out.push({ tag: el.tagName.toLowerCase(), cls: String(el.getAttribute('class') || '').slice(0, 50),
      w: Math.round(r.width), h: Math.round(r.height),
      title: el.getAttribute('title') || '', via: norm(el.textContent) === n ? 'text' : (el.getAttribute('title') ? 'title' : 'aria') });
    if (out.length >= 5) break;
  }
  return out;
})()`;

async function tryClick(page, name, { nth = 0, force = false } = {}) {
  const sel = [
    `button:has-text(${JSON.stringify(name)})`,
    `[role="button"]:has-text(${JSON.stringify(name)})`,
    `[title=${JSON.stringify(name)}]`,
    `[aria-label=${JSON.stringify(name)}]`,
  ].join(',');
  const loc = page.locator(sel).nth(nth);
  if (await loc.count() === 0) return '目标不存在';
  const before = await overlayCount(page);
  const urlBefore = page.url();
  await page.evaluate(() => {
    window.__v2 = { n: 0 };
    new MutationObserver((m) => { window.__v2.n += m.length; })
      .observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
  }).catch(() => {});
  try {
    await loc.click({ timeout: 6000, noWaitAfter: true });
  } catch (e) {
    const why = String(e.message).split('\n').filter((x) => /not stable|intercepts|not visible|detached|not enabled/i.test(x))[0] || 'click失败';
    if (!force) {
      try { await loc.click({ timeout: 5000, force: true, noWaitAfter: true }); return why + ' (需force)'; }
      catch (e2) { return why + ' +force也失败: ' + String(e2.message).split('\n')[0].slice(0, 90); }
    }
  }
  await sleep(1800);
  const after = await overlayCount(page);
  const muts = await page.evaluate(() => (window.__v2 ? window.__v2.n : -1)).catch(() => -2);
  const urlAfter = page.url();
  const toasts = await page.locator('.el-message, .re-toast, .el-notification').allInnerTexts().catch(() => []);
  const changed = after > before || muts > 0 || urlAfter !== urlBefore || toasts.length > 0;
  return `点击成功 | 弹窗${before}->${after} DOM变更${muts} URL变=${urlAfter !== urlBefore}(${urlAfter.replace(BASE, '')}) toast=${JSON.stringify(toasts.slice(0, 1))} -> ${changed ? '有效' : '无副作用(需人工判)'}`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e.message).slice(0, 160)));
  await login(page);

  // ---- 1) 选择角色：先切到新建会话态 ----
  errs.length = 0;
  await page.goto(BASE + '/chat', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await sleep(5000);
  console.log('\n=== 1) 选择角色（需先进入新建会话态） ===');
  let hits = await page.evaluate(findByAnyName('选择角色'));
  console.log('  初始态命中: ' + JSON.stringify(hits));
  if (!hits.length) {
    // 切到新建态：侧栏「新会话」按钮 / 快捷键 Ctrl+Alt+N
    for (const probe of ['button:has-text("新会话")', 'button:has-text("新建会话")', '[title="新会话"]']) {
      if (await page.locator(probe).count() > 0) { console.log('  尝试切新建态: ' + probe); break; }
    }
    await page.keyboard.press('Control+Alt+KeyN').catch(() => {});
    await sleep(2500);
    hits = await page.evaluate(findByAnyName('选择角色'));
    console.log('  快捷键后命中: ' + JSON.stringify(hits));
    if (!hits.length) {
      // 有些实现里「会话」导航项就是回到新建态
      await page.locator('.nav-item:has-text("会话")').first().click({ timeout: 5000 }).catch(() => {});
      await sleep(2500);
      hits = await page.evaluate(findByAnyName('选择角色'));
      console.log('  点侧栏「会话」后命中: ' + JSON.stringify(hits));
    }
  }
  if (hits.length) {
    console.log('  点击: ' + await tryClick(page, '选择角色'));
    console.log('  点击后 URL: ' + page.url().replace(BASE, '') + (errs.length ? ' 错误: ' + errs.join('|') : ''));
  } else {
    console.log('  -> 未复现该视图（新建面板未出现），记录为待查');
  }

  // ---- 2) 模型选择按钮 ----
  errs.length = 0;
  await page.goto(BASE + '/chat', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await sleep(5000);
  console.log('\n=== 2) 模型选择按钮 model-selector-btn ===');
  hits = await page.evaluate(findByAnyName('+ 添加模型'));
  console.log('  「+ 添加模型」命中: ' + JSON.stringify(hits));
  const btn = page.locator('button.model-selector-btn');
  const btnCount = await btn.count();
  console.log('  model-selector-btn 数量: ' + btnCount);
  if (btnCount) {
    const label = await btn.first().innerText().catch(() => '');
    console.log('  当前文案: ' + JSON.stringify(label.trim().slice(0, 40)));
    console.log('  点击: ' + await tryClick(page, label.trim().split('\n')[0] || '+ 添加模型'));
    const panelOpen = await page.evaluate(() => document.querySelectorAll(
      '[class*="model-panel"],[class*="model-selector-panel"],.model-list,[class*="modelPanel"]').length);
    console.log('  模型面板元素数: ' + panelOpen + (errs.length ? ' 错误: ' + errs.join('|') : ''));
    await page.keyboard.press('Escape').catch(() => {});
  }

  // ---- 3) 连接器「编辑」 ----
  errs.length = 0;
  await page.goto(BASE + '/connectors', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await sleep(5000);
  console.log('\n=== 3) 连接器「编辑」(title) ===');
  hits = await page.evaluate(findByAnyName('编辑'));
  console.log('  命中: ' + JSON.stringify(hits));
  if (hits.length) {
    console.log('  点击: ' + await tryClick(page, '编辑'));
    const dlg = await page.evaluate(() => {
      const t = document.body.innerText;
      return { hasEditDlg: /编辑连接器/.test(t), url: location.pathname };
    });
    console.log('  结果: ' + JSON.stringify(dlg) + (errs.length ? ' 错误: ' + errs.join('|') : ''));
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(800);
    // 关不掉就点取消，别把弹窗留给后续
    const cancel = page.locator('button:has-text("取消")').first();
    if (await page.evaluate(() => /编辑连接器/.test(document.body.innerText)).catch(() => false)
      && await cancel.count() > 0) await cancel.click().catch(() => {});
  }

  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
