/**
 * 定向验收：工具调用行交互（默认工具图标 → 悬停「>」→ 点击「v」展开）。
 *
 * 背景：本环境未安装任何工具插件（/v2/plugins/tool-displays 为空），库内会话
 * 均无工具调用记录，因此真机聊天页造不出工具行。本探针跑在临时夹具页
 * `tool-row-check.html`（挂载**真实** MessageToolCalls 组件 + 夹具数据 + contentId
 * 模拟历史消息）上，断言组件自身的样式状态机与展开行为，并回归
 * **A3（2026-10-09）**：展开/开弹窗期间零幽灵端点请求、零「加载工具详情失败」toast；
 * 最终 dist 另跑全套件回归。
 *
 * 用法：node src/acceptance/tool-row-probe.cjs
 *   BASE 默认 http://localhost:15692（自查专用 dev server）
 *   夹具页：{BASE}/src/acceptance/tool-row-check.html
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:15692';
const HARNESS = '/src/acceptance/tool-row-check.html';

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail == null ? '' : detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} :: ${detail}`);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  // A3 根因回归监控：夹具带着 contentId（模拟历史消息），但组件已删除懒加载 ——
  // 展开/开弹窗期间不得向幽灵端点 /message-content/{id}/tool-details 发出任何请求
  // （后端从未实现该端点，旧实现必 404 → 弹「加载工具详情失败」，2026-10-09 报障）。
  const lazyFetches = [];
  page.on('request', (r) => { if (r.url().includes('/message-content/')) lazyFetches.push(r.url()); });
  const toastTexts = () => page.$$eval('.el-message', (els) => els.map((e) => (e.textContent || '').trim()))
    .catch(() => []);

  await page.goto(`${BASE}${HARNESS}`, { waitUntil: 'networkidle', timeout: 60000 });

  const row = page.locator('.tool-row').first();
  await row.waitFor({ state: 'visible', timeout: 20000 });
  // 首帧就绪：字形槽（图标 + 折角）必须先挂上，避免把渲染时序当成状态断言失败
  await page.waitForSelector('.tool-row .glyph-icon', { state: 'attached', timeout: 10000 });
  await page.waitForSelector('.tool-row .glyph-chevron', { state: 'attached', timeout: 10000 });

  const count = await page.locator('.tool-row').count();
  add('rows.count', count === 3, 'rows=' + count);

  const glyphState = async () => page.evaluate(() => {
    const r = document.querySelector('.tool-row');
    const icon = r.querySelector('.glyph-icon');
    const chev = r.querySelector('.glyph-chevron');
    // 「详情」按钮是行体的**同级**（不在 role=button 内部，避免交互控件嵌套）
    const detail = r.parentElement?.querySelector('.tool-row__detail') || null;
    const cs = (el) => (el ? getComputedStyle(el) : null);
    return {
      expanded: r.classList.contains('is-expanded'),
      aria: r.getAttribute('aria-expanded'),
      role: r.getAttribute('role'),
      tabindex: r.getAttribute('tabindex'),
      nestedInteractive: r.querySelectorAll('button, a, [role="button"]').length,
      detailIsSibling: !!(r.parentElement && detail && detail.parentElement === r.parentElement
        && !r.contains(detail)),
      iconDisplay: cs(icon)?.display,
      chevDisplay: cs(chev)?.display,
      chevTransform: cs(chev)?.transform,
      inlineCount: document.querySelectorAll('.tool-inline').length,
      detailOpacity: cs(detail)?.opacity,
      detailText: (detail?.getAttribute('aria-label') || '').trim(),
      actionText: (r.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    };
  });

  // ── 1) 默认态：显示工具图标，无折角 ──
  const s0 = await glyphState();
  add('default.iconShown', s0.iconDisplay !== 'none', `icon.display=${s0.iconDisplay}`);
  add('default.chevronHidden', s0.chevDisplay === 'none', `chevron.display=${s0.chevDisplay}`);
  add('default.notExpanded', s0.expanded === false && s0.aria === 'false', `expanded=${s0.expanded} aria=${s0.aria}`);
  add('default.inlineHidden', s0.inlineCount === 0, 'inline=' + s0.inlineCount);

  // ── 1b) 可访问性：行体是按钮语义，但其**内部不得再嵌套交互控件** ──
  add('a11y.rowButtonRole', s0.role === 'button' && s0.tabindex === '0',
    `role=${s0.role} tabindex=${s0.tabindex}`);
  add('a11y.noNestedInteractive', s0.nestedInteractive === 0, 'nestedInteractive=' + s0.nestedInteractive);
  add('a11y.detailIsSibling', s0.detailIsSibling === true, 'detailIsSibling=' + s0.detailIsSibling);

  // ── 2) 悬停：图标让位给「>」（未旋转） ──
  await row.hover();
  await page.waitForTimeout(300);
  const s1 = await glyphState();
  add('hover.iconHidden', s1.iconDisplay === 'none', `icon.display=${s1.iconDisplay}`);
  add('hover.chevronShown', s1.chevDisplay !== 'none', `chevron.display=${s1.chevDisplay}`);
  add('hover.chevronPointsRight', s1.chevTransform === 'none' || s1.chevTransform === 'matrix(1, 0, 0, 1, 0, 0)',
    'transform=' + s1.chevTransform);
  add('hover.detailButtonVisible', s1.detailOpacity === '1' && s1.detailText.length > 0,
    `opacity=${s1.detailOpacity} label=${s1.detailText}`);

  // ── 3) 点击：展开，折角转向下，内联出现参数+结果 ──
  await row.click();
  await page.waitForTimeout(400);
  const s2 = await glyphState();
  add('expand.isExpanded', s2.expanded === true && s2.aria === 'true', `expanded=${s2.expanded} aria=${s2.aria}`);
  add('expand.chevronDown', s2.chevDisplay !== 'none' && /matrix\(/.test(s2.chevTransform) &&
    Math.abs(Number((s2.chevTransform.match(/matrix\(([^)]+)\)/) || [, ''])[1].split(',')[1])) > 0.5,
    'transform=' + s2.chevTransform);
  add('expand.inlineShown', s2.inlineCount === 1, 'inline=' + s2.inlineCount);
  const inlineText = ((await page.locator('.tool-inline').first().textContent()) || '').replace(/\s+/g, ' ');
  add('expand.hasParams', /调用参数/.test(inlineText) && /path/.test(inlineText),
    'inline="' + inlineText.slice(0, 120) + '"');
  add('expand.hasResult', /执行结果|执行失败/.test(inlineText), 'hasResultText=' + /执行结果|执行失败/.test(inlineText));

  // ── 3b) A3 回归：展开期间不发懒加载请求、不弹「加载工具详情失败」/错误 toast ──
  await page.waitForTimeout(500);
  add('expand.noLazyFetch', lazyFetches.length === 0, JSON.stringify(lazyFetches));
  const toastAfterExpand = await toastTexts();
  const errToastAfterExpand = await page.locator('.el-message--error').count();
  add('expand.noLoadFailedToast',
    !toastAfterExpand.some((t) => t.includes('加载工具详情失败')) && errToastAfterExpand === 0,
    `toasts=${JSON.stringify(toastAfterExpand)} errCount=${errToastAfterExpand}`);

  // ── 4) 再点一次：收起，折角回「>」 ──
  await row.click();
  await page.waitForTimeout(300);
  const s3 = await glyphState();
  add('collapse.isCollapsed', s3.expanded === false && s3.aria === 'false', `expanded=${s3.expanded}`);
  add('collapse.inlineGone', s3.inlineCount === 0, 'inline=' + s3.inlineCount);
  add('collapse.chevronBackRight', s3.chevTransform === 'none' || s3.chevTransform === 'matrix(1, 0, 0, 1, 0, 0)',
    'transform=' + s3.chevTransform);

  // ── 5) 移开鼠标：回到工具图标 ──
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);
  const s4 = await glyphState();
  add('unhover.iconBack', s4.iconDisplay !== 'none' && s4.chevDisplay === 'none',
    `icon=${s4.iconDisplay} chevron=${s4.chevDisplay}`);

  // ── 6) 每行工具图标各不相同（夹具注册 read/search/terminal） ──
  const iconKinds = await page.evaluate(() => Array.from(document.querySelectorAll('.tool-row .glyph-icon'))
    .map((n) => n.innerHTML));
  add('rows.perToolIcons', new Set(iconKinds).size === 3, 'distinctIcons=' + new Set(iconKinds).size);

  // ── 7) 「详情」入口仍可打开原弹窗 ──
  await row.hover();
  await page.waitForTimeout(200);
  await page.locator('.tool-row__detail').first().click();
  await page.waitForTimeout(600);
  const dialogText = ((await page.locator('.el-dialog, .tool-dialog').first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  add('dialog.opens', /工具调用详情/.test(dialogText), 'dialog="' + dialogText.slice(0, 100) + '"');
  // 旧实现 watch(showDialog) 也会触发拉取 → 弹窗路径同样必须零请求、零错误 toast
  await page.waitForTimeout(500);
  add('dialog.noLazyFetch', lazyFetches.length === 0, JSON.stringify(lazyFetches));
  const toastAfterDialog = await toastTexts();
  const errToastAfterDialog = await page.locator('.el-message--error').count();
  add('dialog.noLoadFailedToast',
    !toastAfterDialog.some((t) => t.includes('加载工具详情失败')) && errToastAfterDialog === 0,
    `toasts=${JSON.stringify(toastAfterDialog)} errCount=${errToastAfterDialog}`);

  add('noPageErrors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');

  await browser.close();
  const failed = checks.filter((c) => !c.ok).length;
  console.log(JSON.stringify({ passed: checks.length - failed, failed, checks }, null, 1));
  process.exit(failed ? 3 : 0);
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(3); });
