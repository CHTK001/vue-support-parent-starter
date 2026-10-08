/**
 * 定向验收：#4 模型悬停信息卡 + CustomPopover 弹层行为 + sweep WARN 复核。
 *
 * ui-click-sweep 只点不悬停，这几条路径它覆盖不到：
 *   1. 模型选择面板 hover 模型项 → ModelInfoCard（内部也是 CustomPopover）必须出现、
 *      内容分节齐全、在视口内，鼠标移开即消失；
 *   2. CustomPopover 的三条关闭/重定位路径 —— 弹窗外点击、Esc、窗口 resize —— 都不能报错、
 *      不能把弹层留在视口外、淡入不能卡在 opacity:0；
 *   3. 另一个不带 popperClass 的 CustomPopover 实例（MCP 工具）外点关闭；
 *   4. sweep 判成 no-effect 的「20条/页」下拉：确认下拉是真的弹不出来，还是 sweep 漏判。
 *
 * 结果写 .ui-click-sweep-chunks/hover-popover.json（与 sweep 报告同目录，便于一起归档）。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.ACCEPT_BASE || 'http://localhost:15689';
const OUT = path.join(__dirname, '.ui-click-sweep-chunks', 'hover-popover.json');

/** 已知残留 404（SIGNOFF §4 已列，不属本轮改动范围），命中即不判失败 */
const KNOWN_404 = [
  /\/v2\/sessions\/[^/]+\/goal/,
  /sessionAgentApi|\/session\/agent\//,
  /favicon\.ico/,
  // 天气小组件走的外部天气 API，dev 下由 vite 代理、上游不认这种查询串，
  // 历轮验收脚本（acc-salted-login / acc-prodgrade-frontend 等）都已把它列为环境噪音
  /weather-api/,
];

const checks = [];
const errs = [];
const add = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail: String(detail || '') }); if (!ok) errs.push(name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(p) {
  await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await p.locator('input[type="text"]').first().fill(process.env.USER_NAME || 'admin');
  await p.locator('input[type="password"]').first().fill(process.env.USER_PASS || 'admin123');
  await p.locator('button:has-text("登")').first().click();
  await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 30000 });
  await sleep(1500);
  return true;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  const jsErrors = [];
  const badResponses = [];
  page.on('pageerror', (e) => { jsErrors.push('pageerror: ' + e.message); pageErrors.push('pageerror: ' + e.message); });
  // 资源 404 的 console 噪音归到 HTTP 检查里判，不在这里重复判失败
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/.test(m.text())) return;
    pageErrors.push('console: ' + m.text());
  });
  page.on('response', (r) => { if (r.status() >= 400) badResponses.push(r.status() + ' ' + r.url()); });

  try {
    add('login', await login(page), 'admin');

    // ── 1. 模型面板：currentModel 三级兜底 + 悬停卡 ─────────────────────────
    await page.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('button.model-selector-btn', { timeout: 40000 });
    // 配置就绪：按钮从占位「+ 添加模型」变为真实模型名后，点击才是打开面板语义
    // （未就绪点击走「添加模型」分支 → .model-panel 永不出现，2026-10-08 实测 FATAL）
    let btnReadyText = '';
    for (let i = 0; i < 30; i++) {
      btnReadyText = ((await page.locator('button.model-selector-btn').first().textContent().catch(() => '')) || '').trim();
      if (btnReadyText && !/添加模型/.test(btnReadyText)) break;
      await page.waitForTimeout(1000);
    }
    add('panel.configReady', !!btnReadyText && !/添加模型/.test(btnReadyText),
      'btnText=' + btnReadyText.replace(/\s+/g, ' ').slice(0, 40));
    await page.locator('button.model-selector-btn').click();
    await page.waitForSelector('.model-panel', { timeout: 15000 });
    add('panel.open', true, 'panel=1');

    const panel = page.locator('.model-panel');
    const panelOpen = async () => await panel.count() > 0 && await panel.first().isVisible().catch(() => false);
    // 面板内容异步渲染，不等就断言会读到空 count 的假失败
    await page.waitForSelector('.current-model-item', { timeout: 15000 }).catch(() => {});

    const cur = page.locator('.current-model-item');
    add('panel.currentModel', await cur.count() > 0,
      'count=' + (await cur.count()) + ' text=' + ((await cur.first().textContent().catch(() => '')) || '').trim());

    const act = page.locator('.model-item-active');
    add('panel.active', await act.count() > 0,
      'count=' + (await act.count()) + ' text=' + ((await act.first().textContent().catch(() => '')) || '').trim());

    const items = page.locator('.model-item');
    const n = await items.count();
    add('panel.items', n > 0, 'count=' + n);

    // 模型名显示口径：显示裸模型名，不能把复合键 `providerId:modelId` 当名字
    // （用户实测：面板/选择器按钮显示成 `1791352877398:laguna-s-2.1`）
    const curText = ((await cur.first().textContent().catch(() => '')) || '').trim();
    add('model.rowNoCompositeKey', curText.length > 0 && !curText.includes(':'),
      `current="${curText.replace(/\s+/g, ' ').slice(0, 60)}"`);
    add('model.btnNoCompositeKey', !!btnReadyText && !btnReadyText.includes(':'),
      `btn="${btnReadyText.replace(/\s+/g, ' ').slice(0, 60)}"`);
    const itemTitles = await page.locator('.model-item .text-sm.font-medium').allTextContents();
    const compositeTitles = itemTitles.map((t) => t.trim()).filter((t) => t.includes(':'));
    add('model.itemsNoCompositeKey', itemTitles.length > 0 && compositeTitles.length === 0,
      `titles=${itemTitles.length} composite=${JSON.stringify(compositeTitles.slice(0, 3))}`);

    // 悬停第 2 个模型项（避开当前项，确保 hover 目标不同）
    const target = n > 1 ? items.nth(1) : items.first();
    await target.hover();
    const card = page.locator('.model-info-popover');
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) {
      seen = await card.count() > 0 && await card.first().isVisible().catch(() => false);
      if (!seen) await sleep(100);
    }
    // 卡片必须真正淡入（CustomPopover 用 pop-init→pop-run 切 opacity）
    let opacity = '';
    if (seen) {
      for (let i = 0; i < 30; i++) {
        opacity = await card.first().evaluate((el) => getComputedStyle(el).opacity).catch(() => '0');
        if (parseFloat(opacity) > 0.9) break;
        await sleep(100);
      }
    }
    const cardText = seen ? (await card.first().textContent().catch(() => '')) : '';
    add('hover.card.show', seen && parseFloat(opacity) > 0.9,
      'visible=' + seen + ' opacity=' + opacity + ' text=' + (cardText || '').replace(/\s+/g, ' ').slice(0, 100));
    add('hover.card.content', seen && /成本|限制|模态|能力|元数据/.test(cardText || ''),
      'hasSections=' + /成本|限制|模态|能力|元数据/.test(cardText || ''));

    const inView = seen ? await card.first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= -1 && r.left >= -1 && r.bottom <= window.innerHeight + 1 && r.right <= window.innerWidth + 1;
    }) : false;
    add('hover.card.inViewport', inView, 'inside viewport=' + inView);

    // 移开鼠标 → 卡片必须消失（面板本身仍开着，属于正常）
    await page.mouse.move(5, 5);
    let gone = false;
    for (let i = 0; i < 30 && !gone; i++) {
      gone = await card.count() === 0 || !(await card.first().isVisible().catch(() => false));
      if (!gone) await sleep(100);
    }
    add('hover.card.hide', gone, 'gone after mouseout=' + gone);

    // ── 2. CustomPopover：外部点击关闭 ─────────────────────────────────────
    // 移出只隐藏信息卡，面板仍开着；先归位到「已关闭」再重开，
    // 否则按钮的 toggle 会把它关掉，waitForSelector 白等。
    const ensureClosed = async () => {
      if (await panelOpen()) {
        await page.locator('button.model-selector-btn').click();
        for (let i = 0; i < 30 && await panelOpen(); i++) await sleep(100);
      }
    };
    await ensureClosed();
    const b2 = pageErrors.length;
    await page.locator('button.model-selector-btn').click();
    await page.waitForSelector('.model-panel', { timeout: 15000 });
    add('popover.reopen', await panelOpen(), 'reopened, newErrors=' + (pageErrors.length - b2));

    const before = pageErrors.length;
    await page.mouse.click(1200, 300); // 面板外的空白区
    let closed = false;
    for (let i = 0; i < 30 && !closed; i++) {
      closed = !(await panelOpen());
      if (!closed) await sleep(100);
    }
    add('popover.clickOutside', closed, 'closed=' + closed + ' newErrors=' + (pageErrors.length - before));

    // ── 3. Esc 关闭 ────────────────────────────────────────────────────────
    await ensureClosed();
    await page.locator('button.model-selector-btn').click();
    await page.waitForSelector('.model-panel', { timeout: 15000 });
    await page.keyboard.press('Escape');
    let escClosed = false;
    for (let i = 0; i < 30 && !escClosed; i++) {
      escClosed = !(await panelOpen());
      if (!escClosed) await sleep(100);
    }
    add('popover.esc', escClosed, 'closed=' + escClosed);

    // ── 4. resize：弹层重定位且不越界、不报错 ───────────────────────────────
    await ensureClosed();
    await page.locator('button.model-selector-btn').click();
    await page.waitForSelector('.model-panel', { timeout: 15000 });
    const b4Resize = pageErrors.length;
    await page.setViewportSize({ width: 1100, height: 760 });
    await sleep(600);
    const box = await page.locator('.model-popover').first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { t: Math.round(r.top), l: Math.round(r.left), b: Math.round(r.bottom), r: Math.round(r.right), op: getComputedStyle(el).opacity };
    }).catch(() => null);
    const fit = box && box.t >= -1 && box.l >= -1 && box.b <= 761 && box.r <= 1101;
    add('popover.resize', !!fit, JSON.stringify(box) + ' newErrors=' + (pageErrors.length - b4Resize));
    // 淡入必须真的走完（pop-init → pop-run），opacity 卡在 0 等于面板看不见
    add('popover.resize.opacity', !!box && parseFloat(box.op) > 0.9, 'opacity=' + (box && box.op));

    // ── 5. 另一个 CustomPopover 实例（MCP 工具）外点关闭 ────────────────────
    // 这些实例不带 popperClass，CustomPopover 又 teleport 到 body，只能按
    // 「body 直属的 fixed 弹层」计数；先把上一步还开着的模型面板关掉做基线
    const fixedCnt = () => page.evaluate(() => document.querySelectorAll('body > div.fixed').length);
    const mcpBtn = page.locator('button[aria-label="MCP 工具"]');
    if (await mcpBtn.count() > 0) {
      await ensureClosed();
      const b5 = pageErrors.length;
      const beforeCnt = await fixedCnt();
      await mcpBtn.click();
      await sleep(700);
      const openCnt = await fixedCnt();
      await page.mouse.click(900, 200);
      await sleep(700);
      const afterCnt = await fixedCnt();
      add('mcpPopover.open', openCnt > beforeCnt,
        'fixed before=' + beforeCnt + ' open=' + openCnt + ' afterOutsideClick=' + afterCnt + ' newErrors=' + (pageErrors.length - b5));
      add('mcpPopover.clickOutside', openCnt > beforeCnt && afterCnt < openCnt,
        'open=' + openCnt + ' after=' + afterCnt);
    }

    // ── 6. sweep WARN 复核：分页「20条/页」到底有没有反应 ──────────────────
    // sweep 报 no-effect（接口0 toast0 弹窗0 DOM变更0），需要确认
    // 它点的是 el-select 的 wrapper，下拉是否真的弹出来
    await page.setViewportSize({ width: 1512, height: 950 });
    await page.goto(BASE + '/app-keys', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('.el-select__wrapper', { timeout: 30000 }).catch(() => {});
    const psWrap = page.locator('.el-select__wrapper').first();
    if (await psWrap.count() > 0) {
      const b6 = pageErrors.length;
      await psWrap.click();
      await sleep(700);
      const dd = await page.evaluate(() => {
        const els = [...document.querySelectorAll('.el-select-dropdown, .el-popper')];
        const vis = els.filter((e) => {
          const s = getComputedStyle(e);
          return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05 && e.getBoundingClientRect().height > 0;
        });
        return { all: els.length, visible: vis.length, text: (vis[0] ? vis[0].textContent : '').replace(/\s+/g, ' ').slice(0, 60) };
      });
      add('pageSize.dropdown', dd.visible > 0, JSON.stringify(dd) + ' newErrors=' + (pageErrors.length - b6));
      await page.keyboard.press('Escape');
    }

    // ── 7. 网络 4xx/5xx：已知残留不判失败，未知的必须暴露 ───────────────────
    const unexpected = badResponses.filter((s) => !KNOWN_404.some((re) => re.test(s)));
    add('noUnexpectedHttpError', unexpected.length === 0,
      unexpected.slice(0, 6).join(' | ') || ('clean; known-404=' + (badResponses.length - unexpected.length)));
    add('noPageErrors', jsErrors.length === 0, jsErrors.slice(0, 8).join(' | ') || 'clean');

    const report = {
      generatedAt: new Date().toISOString(),
      base: BASE,
      pass: checks.filter((c) => c.ok).length,
      fail: errs.length,
      checks,
      badResponses: badResponses.slice(0, 40),
      jsErrors: jsErrors.slice(0, 40),
      pageErrors: pageErrors.slice(0, 40),
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
    for (const c of checks) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.name + ' :: ' + c.detail);
    console.log('--- ' + report.pass + ' pass, ' + report.fail + ' fail -> ' + OUT);
    process.exitCode = errs.length ? 1 : 0;
  } catch (e) {
    console.error('FATAL', e && e.stack || e);
    process.exitCode = 2;
  } finally {
    await browser.close().catch(() => {});
  }
})();
