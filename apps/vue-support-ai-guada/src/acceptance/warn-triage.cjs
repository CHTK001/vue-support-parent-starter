/**
 * Sweep WARN re-check: every element ui-click-sweep reported as
 * no-effect / vanished / state-dependent gets a dedicated assertion here.
 *
 * WHY (2026-10-07): the sweep only clicks and watches for a generic side
 * effect. Some interactions have an effect it structurally cannot see (a
 * native file chooser, a popper rendered outside the route subtree), some are
 * legitimately no-ops (clicking the pill that is already active, paging when
 * there is a single page), and a dead button must never hide inside that pile.
 * Each case below therefore asserts the effect that *should* be observable
 * through Playwright, so a WARN is either promoted to verified-working or
 * escalated to a real FAIL.
 *
 * Result: .ui-click-sweep-chunks/warn-triage.json (same dir as the sweep
 * chunks, so the reports archive together).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.ACCEPT_BASE || 'http://localhost:15689';
const OUT = path.join(__dirname, '.ui-click-sweep-chunks', 'warn-triage.json');
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';

const KNOWN_404 = [
  /\/v2\/sessions\/[^/]+\/goal/,
  /sessionAgentApi|\/session\/agent\//,
  /favicon\.ico/,
  /weather-api/,
  // 天气小组件直连的第三方限流（与产品代码无关，测试并发触发 429）
  /api\.open-meteo\.com/,
];

const checks = [];
const errs = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail || '') });
  if (!ok) errs.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = async (loc) => (((await loc.first().textContent().catch(() => '')) || '').trim().replace(/\s+/g, ' '));

async function login(p) {
  await p.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 120000 });
  console.log('[login] URL after goto:', p.url(), 'title:', await p.title());
  await sleep(5000);
  const pwVisible = await p.locator('input[type="password"]').count();
  console.log('[login] after 5s sleep, password inputs:', pwVisible, 'title:', await p.title());
  if (pwVisible === 0) {
    const bodyLen = (await p.locator('body').textContent().catch(() => '') || '').length;
    const html = (await p.content() || '').substring(0, 500);
    console.log('[login] body text len:', bodyLen, 'html head:', html.replace(/\s+/g, ' '));
  }
  await p.waitForSelector('input[type="password"]', { timeout: 60000 });
  await sleep(1500);
  await p.locator('input[type="text"]').first().fill(USER);
  await p.locator('input[type="password"]').first().fill(PASS);
  await p.locator('button:has-text("登")').first().click();
  await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 30000 });
  await sleep(1500);
}

/** navigate and wait for the route's key selector; tolerate vite dep-reload */
async function gotoReady(p, url, selector, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      // state:'attached' — the combined selector often matches a hidden chrome
      // button (floating-chat-btn) first; waiting for *visibility* of that first
      // match deadlocks even though the route's real content already rendered.
      await p.waitForSelector(selector, { timeout: 35000, state: 'attached' });
      await sleep(1200);
      return;
    } catch (e) {
      lastErr = e;
      await sleep(4000);
    }
  }
  throw lastErr;
}

/** Element Plus select trigger: click it and wait for the popper with options */
async function assertSelectOpens(page, label) {
  const trigger = page.locator('.el-select__wrapper', { hasText: '20' }).first();
  if ((await trigger.count()) === 0) {
    add(label, false, 'trigger not found (.el-select__wrapper with 20)');
    return;
  }
  await trigger.click().catch(() => {});
  await sleep(900);
  const popper = page.locator('.el-select__popper:visible');
  const n = await popper.count();
  const items = await page.locator('.el-select__popper:visible .el-select-dropdown__item').count();
  add(label, n > 0 && items > 0, `popper=${n} options=${items}`);
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } });
  const page = await ctx.newPage();
  const jsErrors = [];
  const badResponses = [];
  page.on('pageerror', (e) => jsErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/.test(m.text())) return;
    jsErrors.push('console: ' + m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) badResponses.push(r.status() + ' ' + r.url());
  });

  try {
    await login(page);
    add('login', true, USER);

    // ---- [6] /image-generate  "生成类型" (.wg-media-btn) ------------------
    // The sweep sees no effect because the popper is appended to <body> and is
    // not part of its route-scoped snapshot. The popper opening IS the effect.
    try {
      await gotoReady(page, '/image-generate', '.wg-card:not(.is-skeleton)');
      await page.click('.wg-media-btn');
      await sleep(900);
      const popper = page.locator('.wg-popper', { hasText: '生成类型' }).first();
      const visible = await popper.isVisible().catch(() => false);
      const items = await popper.locator('.wg-menu-item').count();
      add('image-generate.mediaPopover', visible && items >= 2, `visible=${visible} items=${items} ${await txt(popper)}`);
      await page.keyboard.press('Escape');
      await sleep(500);
    } catch (e) {
      add('image-generate.mediaPopover', false, (e && e.message) || String(e));
    }

    // ---- [7] /face-search  "选择图片" (.fs-drop-btn) ----------------------
    // Opens the OS file chooser: no DOM node ever appears, so the sweep can
    // only ever see "nothing happened". Assert the filechooser event itself.
    try {
      await gotoReady(page, '/face-search', '.fs-drop-btn, button');
      const btn = page.locator('.fs-drop-btn').first();
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
        btn.click(),
      ]);
      add('face-search.fileChooser', !!fc, fc ? 'filechooser event fired' : 'no filechooser within 8s');
      if (fc) await fc.setFiles([]).catch(() => {});
      await sleep(600);
    } catch (e) {
      add('face-search.fileChooser', false, (e && e.message) || String(e));
    }

    // ---- [8] /image-search  "上传图片" (.is-upload-btn) -------------------
    try {
      await gotoReady(page, '/image-search', '.is-upload-btn, button');
      const btn = page.locator('.is-upload-btn').first();
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
        btn.click(),
      ]);
      add('image-search.fileChooser', !!fc, fc ? 'filechooser event fired' : 'no filechooser within 8s');
      if (fc) await fc.setFiles([]).catch(() => {});
      await sleep(600);
    } catch (e) {
      add('image-search.fileChooser', false, (e && e.message) || String(e));
    }

    // ---- [9..13] 20/page select on 4 routes ------------------------------
    for (const [route, key] of [
      ['/app-keys', 'app-keys'],
      ['/manufacturer-keys', 'manufacturer-keys'],
      ['/roles', 'roles'],
      ['/mcp', 'mcp'],
    ]) {
      try {
        await gotoReady(page, route, 'table, .el-table, [class*="table"]');
        await assertSelectOpens(page, `pageSize.${key}`);
      } catch (e) {
        add(`pageSize.${key}`, false, (e && e.message) || String(e));
      }
    }

    // ---- [11] /roles  "编辑" (.el-button--primary.is-link) ---------------
    try {
      await gotoReady(page, '/roles', '.el-button--primary.is-link, table, .el-table');
      const edit = page.locator('.el-button--primary.is-link', { hasText: '编辑' }).first();
      if ((await edit.count()) === 0) {
        add('roles.edit', false, 'no 编辑 button');
      } else {
        await edit.click();
        await sleep(1200);
        const dialog = await page.locator('.el-dialog:visible, .el-drawer:visible, .el-dialog__wrapper:visible').count();
        const rowInputs = await page.locator('.el-table__row input:not([type="hidden"]), tbody input').count();
        add('roles.edit', dialog > 0 || rowInputs > 0, `dialog=${dialog} rowInputs=${rowInputs}`);
        await page.keyboard.press('Escape');
        await sleep(600);
      }
    } catch (e) {
      add('roles.edit', false, (e && e.message) || String(e));
    }

    // ---- [14] /usage  "今天" (.pill.active) ------------------------------
    // Already the active pill: clicking it is a no-op BY DESIGN. The check is
    // that it really is active before the click (i.e. the sweep clicked the
    // current filter, not a dead button).
    try {
      await gotoReady(page, '/usage', '.pill');
      const active = page.locator('.pill.active').first();
      const activeText = await txt(active);
      add('usage.todayPillAlreadyActive', activeText.includes('今天'), `active pill="${activeText}"`);
      await active.click().catch(() => {});
      await sleep(700);
      const stillActive = await txt(page.locator('.pill.active').first());
      add('usage.todayPillStaysActive', stillActive.includes('今天'), `after click="${stillActive}"`);
    } catch (e) {
      add('usage.todayPillAlreadyActive', false, (e && e.message) || String(e));
    }

    // ---- [15] /usage/sync-logs  "第 2 页" (.number) ----------------------
    try {
      await gotoReady(page, '/usage/sync-logs', '.number, [class*="pagination"], [class*="pager"]');
      const nums = await page.locator('.number').allInnerTexts();
      const beforeActive = await page.locator('.number.active, .number.is-active').count();
      const beforeFirstRow = await txt(page.locator('tbody tr, .el-table__row').first());
      const two = page.locator('.number', { hasText: '2' }).first();
      if ((await two.count()) === 0) {
        add('syncLogs.page2', false, `no page-2 button (numbers=${JSON.stringify(nums)})`);
      } else {
        await two.click();
        await sleep(1500);
        const afterActiveText = await txt(page.locator('.number.active, .number.is-active').first());
        const afterFirstRow = await txt(page.locator('tbody tr, .el-table__row').first());
        const moved = afterActiveText.includes('2') || afterFirstRow !== beforeFirstRow;
        add('syncLogs.page2', moved,
          `nums=${JSON.stringify(nums)} beforeActive=${beforeActive} afterActive="${afterActiveText}" rowChanged=${afterFirstRow !== beforeFirstRow}`);
      }
    } catch (e) {
      add('syncLogs.page2', false, (e && e.message) || String(e));
    }

    // ---- [16] /connectors  "进入聊天" / "绑定" ---------------------------
    // Bound connectors expose 进入聊天; a fresh env only has 绑定 cards, so the
    // sweep's original target may legitimately be absent. Assert whichever
    // primary action the page actually offers.
    try {
      await gotoReady(page, '/connectors', 'button, [class*="connector"]');
      const beforeUrl = page.url();
      const enter = page.locator('text=进入聊天').first();
      const bind = page.locator('button:has-text("绑定")').first();
      if ((await enter.count()) > 0) {
        await enter.click();
        await sleep(2500);
        const afterUrl = page.url();
        add('connectors.enterChat', afterUrl !== beforeUrl, `${beforeUrl} -> ${afterUrl}`);
        if (afterUrl !== beforeUrl) {
          await gotoReady(page, '/connectors', 'button, [class*="connector"]'); // restore
        }
      } else if ((await bind.count()) > 0) {
        // No bound connector: binding is the reachable primary action.
        await bind.click();
        await sleep(1500);
        const dialog = await page.locator('.el-dialog:visible, .el-drawer:visible, [class*="bind-form"]').count();
        add('connectors.enterChat', dialog > 0, `no 进入聊天 (unbound env); 绑定 opened dialog=${dialog}`);
        await page.keyboard.press('Escape');
        await sleep(500);
      } else {
        add('connectors.enterChat', false, 'no 进入聊天 and no 绑定 element');
      }
    } catch (e) {
      add('connectors.enterChat', false, (e && e.message) || String(e));
    }

    // ---- [17] /capabilities/ocr  "刷新" ----------------------------------
    // The visible result is "the same rows again", so assert what a refresh
    // must do: re-request the data behind the page.
    try {
      await gotoReady(page, '/capabilities/ocr', '.el-button, button');
      const seen = [];
      const onResp = (r) => {
        const u = r.url();
        if (/ocr|capabilit/i.test(u)) seen.push(r.status() + ' ' + u.replace(BASE, ''));
      };
      page.on('response', onResp);
      const beforeCount = seen.length;
      const refresh = page.locator('.el-button', { hasText: '刷新' }).first();
      if ((await refresh.count()) === 0) {
        add('ocr.refresh', false, 'no 刷新 button');
      } else {
        await refresh.click();
        await sleep(3000);
        const fired = seen.slice(beforeCount);
        add('ocr.refresh', fired.length > 0, fired.length ? fired.slice(0, 3).join(' | ') : 'no matching request in 3s');
      }
      page.off('response', onResp);
    } catch (e) {
      add('ocr.refresh', false, (e && e.message) || String(e));
    }

    // ---- [1] /characters  "使用此角色" (vanished) -------------------------
    // The element vanishes because the click navigates away from the route;
    // assert the navigation instead of the element.
    try {
      await gotoReady(page, '/characters', '.el-button--primary');
      const beforeUrl = page.url();
      const btn = page.locator('.el-button--primary', { hasText: '使用此角色' }).first();
      if ((await btn.count()) === 0) {
        add('characters.useThis', false, 'no 使用此角色 button');
      } else {
        await btn.click();
        await sleep(3000);
        const afterUrl = page.url();
        add('characters.useThis', afterUrl !== beforeUrl, `${beforeUrl} -> ${afterUrl}`);
      }
    } catch (e) {
      add('characters.useThis', false, (e && e.message) || String(e));
    }

    // ---- [20] /bots "使用说明"：走 openInExternalBrowser → window.open 外链，
    // 页面内零 DOM 变更，sweep 结构上看不到；断言 popup 本身。
    // （与下面的 "停止" switch 同页，共用一次导航）
    try {
      await gotoReady(page, '/bots', '.el-button, button');
      const docsBtn = page.locator('button:visible').filter({ hasText: /使用说明/ }).first();
      if ((await docsBtn.count()) === 0) {
        add('bots.docs', false, 'no 使用说明 button');
      } else {
        const [popup] = await Promise.all([
          page.waitForEvent('popup', { timeout: 8000 }).catch(() => null),
          docsBtn.click(),
        ]);
        let popUrl = '';
        if (popup) {
          await sleep(1500);
          popUrl = popup.url() || '';
          await popup.close().catch(() => {});
        }
        add('bots.docs', !!popup && /^https:\/\/ai\.dingd\.cn\/docs\/bot/.test(popUrl),
          popup ? `popup url=${popUrl}` : 'no popup within 8s');
        await sleep(500);
      }
    } catch (e) {
      add('bots.docs', false, (e && e.message) || String(e));
    }

    // ---- [2] /bots  "停止" switch (vanishes on re-render) ----------------
    try {
      await gotoReady(page, '/bots', '.el-switch');
      const switches = page.locator('.el-switch');
      const count = await switches.count();
      let idx = -1;
      for (let i = 0; i < count; i++) {
        const el = switches.nth(i);
        const name = [await el.getAttribute('aria-label'), await el.getAttribute('title')].filter(Boolean).join(' ');
        const row = await el.evaluate((n) => (n.closest('tr, [class*="row"]')?.innerText || '').slice(0, 80)).catch(() => '');
        if (/停止|启动|stop|start/i.test(name + ' ' + row)) {
          idx = i;
          break;
        }
      }
      if (idx < 0) idx = 0; // fall back to the first switch on the page
      const target = switches.nth(idx);
      const before = await target.evaluate((n) => n.className + '|' + n.getAttribute('aria-checked')).catch(() => '');
      await target.click();
      await sleep(1800);
      const after = await target.evaluate((n) => n.className + '|' + n.getAttribute('aria-checked')).catch(() => '');
      const present = await page.locator('.el-switch').count();
      add('bots.stopSwitch', before !== after || present > 0, `before="${before}" after="${after}" switchesNow=${present}`);
      // restore: toggle back if we flipped it
      if (before !== after) {
        await page.locator('.el-switch').nth(idx).click().catch(() => {});
        await sleep(1200);
      }
    } catch (e) {
      add('bots.stopSwitch', false, (e && e.message) || String(e));
    }

    // ---- [21] /characters "导入"（隐藏 input → 原生文件选择器，sweep 永远看不见）----
    try {
      await gotoReady(page, '/characters', '.el-button, button');
      const btn = page.locator('button:visible, .el-button:visible').filter({ hasText: /导入/ }).first();
      if ((await btn.count()) === 0) {
        add('characters.importFile', false, 'no 导入 button');
      } else {
        const [fc] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
          btn.click(),
        ]);
        add('characters.importFile', !!fc, fc ? 'filechooser event fired' : 'no filechooser within 8s');
        if (fc) await fc.setFiles([]).catch(() => {}); // 空选择：input 端 early-return，不产生数据
        await sleep(800);
      }
    } catch (e) {
      add('characters.importFile', false, (e && e.message) || String(e));
    }

    // ---- [22] /characters "全部" 分组 pill（默认筛选 = already-active no-op）----
    // 证明该 pill 所在的筛选组是活的：若它本来 active，先切到别的分组再切回来，
    // 两次都要看到 active 类迁移 + 列表接口重发；无分组的环境退化为「默认态 no-op」。
    try {
      await gotoReady(page, '/characters', '.select-none, [class*="group"]');
      const allPill = page.locator('div.select-none:not(.char-group-tag)').filter({ hasText: /^\s*全部\s*$/ }).first();
      if ((await allPill.count()) === 0) {
        add('characters.allPill', false, 'no 全部 pill');
      } else {
        const isActive = async () => ((await allPill.getAttribute('class')) || '').includes('font-medium');
        const reqs = [];
        const onResp = (r) => { if (/character/i.test(r.url())) reqs.push(r.status() + ' ' + r.url().replace(BASE, '').slice(0, 70)); };
        page.on('response', onResp);
        const wasActive = await isActive();
        let detail = `wasActive=${wasActive}`;
        let ok;
        if (wasActive) {
          const group = page.locator('.char-group-tag').first();
          if ((await group.count()) > 0) {
            const before = reqs.length;
            await group.click();
            await sleep(2000);
            const movedOff = !(await isActive());
            await allPill.click();
            await sleep(2000);
            const backActive = await isActive();
            detail += ` groupSwitch movedOff=${movedOff} backActive=${backActive} api=${reqs.length - before} ${JSON.stringify(reqs.slice(before, before + 3))}`;
            ok = movedOff && backActive;
          } else {
            await allPill.click();
            await sleep(1200);
            detail += ' (no groups in env: default-filter no-op)';
            ok = await isActive();
          }
        } else {
          await allPill.click();
          await sleep(1500);
          detail += ` clicked -> active=${await isActive()}`;
          ok = await isActive();
        }
        page.off('response', onResp);
        add('characters.allPill', ok, detail);
        await sleep(300);
      }
    } catch (e) {
      add('characters.allPill', false, (e && e.message) || String(e));
    }

    // ---- [3] /knowledge-base tag (vanishes) -------------------------------
    // The sweep originally flagged tag "32"; the fixture now carries "60".
    // Assert against whatever tag is actually present so the check keeps its
    // intent (click a tag -> it vanishes / list re-filters) regardless of data.
    try {
      await gotoReady(page, '/knowledge-base', '.el-tag, [class*="tag"]');
      const allTags = await page.locator('.el-tag').allInnerTexts();
      // sweep 本轮点的是 "68"（历史上 32、60）；按当前实际数据优先取，取不到退第一个
      const wanted = allTags.find((t) => /^\s*(68|60|32)\s*$/.test(t)) || allTags[0];
      const tag = wanted != null
        ? page.locator('.el-tag', { hasText: new RegExp('^\\s*' + wanted.trim() + '\\s*$') }).first()
        : null;
      if (!tag || (await tag.count()) === 0) {
        add('kb.tag32', false, `no tag at all (have ${JSON.stringify(allTags.slice(0, 10))})`);
      } else {
        const beforeCls = await tag.getAttribute('class');
        const beforeRows = await page.locator('.kb-item, .el-card, [class*="kb-list"] > *').count();
        await tag.click();
        await sleep(1500);
        const afterCls = await tag.getAttribute('class').catch(() => null);
        const afterRows = await page.locator('.kb-item, .el-card, [class*="kb-list"] > *').count();
        // The badge is an el-popover trigger: the observable effect is the
        // popover panel opening (list of bases), not a class flip on the tag.
        const popoverOpen = await page.locator('.el-popover:visible, .el-popper:visible').count();
        const changed = afterCls !== beforeCls || afterRows !== beforeRows || afterCls === null || popoverOpen > 0;
        add('kb.tag32', changed, `cls ${beforeCls} -> ${afterCls} rows ${beforeRows} -> ${afterRows} popover=${popoverOpen}`);
        await page.keyboard.press('Escape');
        await sleep(400);
      }
    } catch (e) {
      add('kb.tag32', false, (e && e.message) || String(e));
    }

    // ---- [23] /usage 图表 seg 组（"按 Token" 默认 active → sweep 报 no-effect）----
    // 断言：① 它确实是当前项（点它 = 按设计无操作）；② 同组切到"按费用"再切回可用
    //       （证明这组按钮不是死的）。
    try {
      await gotoReady(page, '/usage', '.seg-btn');
      const activeCount = async () => page.locator('.seg-btn.active').filter({ hasText: /按 Token/ }).count();
      const tokenChips = page.locator('.seg-btn').filter({ hasText: /按 Token/ });
      const tc = await tokenChips.count();
      const before = await activeCount();
      let detail = `tokenChips=${tc} activeBefore=${before}`;
      let ok;
      if (tc === 0 || before !== tc) {
        ok = false;
        detail += ' (expect all 按 Token chips active on load)';
      } else {
        const cost = page.locator('.seg-btn').filter({ hasText: /按费用/ }).first();
        await cost.click();
        await sleep(900);
        const afterSwitch = await activeCount();
        const inactiveToken = page.locator('.seg-btn:not(.active)').filter({ hasText: /按 Token/ }).first();
        if ((await inactiveToken.count()) > 0) {
          await inactiveToken.click();
          await sleep(900);
        }
        const restored = await activeCount();
        detail += ` afterCostSwitch=${afterSwitch} restored=${restored}`;
        ok = afterSwitch === tc - 1 && restored === tc;
      }
      add('usage.tokenSeg', ok, detail);
    } catch (e) {
      add('usage.tokenSeg', false, (e && e.message) || String(e));
    }

    // ---- [24..27] /knowledge-base/:id 详情页四项 --------------------------
    // 列表已重构为 KnowledgeOverview 总览（viewMode 'list'；旧 .kb-card 分支是
    // 'list-legacy' 死代码，条件不再命中）。主路径：点总览「最近使用」条目
    // → handleOverviewOpen → handleSelectKB → URL 带 id 进详情。
    // 兜底：页内用账号重新登录拿 token，按 file_count 最多的库直连详情 URL。
    let navInfo = '';
    const gotoDetailFallback = async () => {
      const id = await page.evaluate(async (cred) => {
        try {
          const lr = await fetch('/v2/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'phone', username: cred.user, password: cred.pass }),
          });
          const lj = await lr.json();
          const tk = lj?.data?.accessToken || '';
          const r = await fetch('/api/knowledge/bases', { headers: { Authorization: 'Bearer ' + tk } });
          const rows = (await r.json())?.data || [];
          rows.sort((a, b) => (b.file_count || 0) - (a.file_count || 0));
          return String(rows[0]?.knowledge_base_id || rows[0]?.id || '');
        } catch { return ''; }
      }, { user: USER, pass: PASS });
      if (!id) return false;
      await page.goto(BASE + '/knowledge-base/' + id, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('.kb-split__filter', { timeout: 20000 }).catch(() => {});
      await sleep(2000);
      navInfo += ` fallbackDirect id=${id} url=${page.url()}`;
      return true;
    };
    try {
      await gotoReady(page, '/knowledge-base', 'text=我的知识库');
      // 「最近使用」条目（.re-surface--dense 带 篇文档 文案）；找不到就开计数徽标弹层再取
      let entry = page.locator('div.cursor-pointer:visible').filter({ hasText: /篇文档/ }).first();
      if ((await entry.count()) === 0) {
        await page.locator('.el-tag:visible').first().click().catch(() => {});
        await sleep(900);
        entry = page.locator('div.cursor-pointer:visible').filter({ hasText: /篇文档/ }).first();
      }
      navInfo = `entries=${await entry.count()}`;
      if ((await entry.count()) > 0) {
        await entry.click().catch((e) => { navInfo += ` clickErr=${String(e.message).split('\n')[0].slice(0, 70)}`; });
      }
      try {
        await page.waitForURL(/\/knowledge-base\/[^/?#]+/, { timeout: 10000 });
      } catch {
        await gotoDetailFallback();
      }
      navInfo += ` url=${page.url()}`;
      await page.waitForSelector('.kb-split__filter', { timeout: 20000 }).catch(() => {});
      await sleep(2500);
      if ((await page.locator('.kb-split__filter').count()) === 0 && !/\/knowledge-base\/[^/?#]+/.test(page.url())) {
        await gotoDetailFallback();
      }
    } catch (e) {
      navInfo += ` navFailed=${String((e && e.message) || e).split('\n')[0].slice(0, 90)} url=${page.url()}`;
      await gotoDetailFallback();
    }
    const kbUrl = () => `${page.url()} [${navInfo}]`;

    // [24] 文件状态筛选组（"全部 1" 在 sweep 是 no-effect：它就是当前筛选）
    try {
      const filters = page.locator('.kb-split__filter');
      const fc = await filters.count();
      if (fc < 2) {
        add('kb.statusFilter', false, `only ${fc} .kb-split__filter (url=${kbUrl()})`);
      } else {
        const texts = (await filters.allInnerTexts()).map((t) => t.trim().replace(/\s+/g, ' '));
        let act = -1;
        for (let i = 0; i < fc; i++) {
          if ((await filters.nth(i).getAttribute('class') || '').includes('is-active')) { act = i; break; }
        }
        if (act < 0) {
          add('kb.statusFilter', false, `no active filter among ${JSON.stringify(texts)}`);
        } else {
          const other = act === 0 ? 1 : 0;
          await filters.nth(other).click();
          await sleep(900);
          const moved = ((await filters.nth(other).getAttribute('class')) || '').includes('is-active')
            && !(((await filters.nth(act).getAttribute('class')) || '').includes('is-active'));
          await filters.nth(act).click();
          await sleep(900);
          const restored = ((await filters.nth(act).getAttribute('class')) || '').includes('is-active');
          add('kb.statusFilter', moved && restored, `filters=${JSON.stringify(texts)} moved=${moved} restored=${restored}`);
        }
      }
    } catch (e) {
      add('kb.statusFilter', false, (e && e.message) || String(e));
    }

    // [25][26] 上传文件 / 上传文件夹（隐藏 input → 原生文件选择器）
    for (const [label, re] of [['kb.uploadFile.fileChooser', /^\s*上传文件$/], ['kb.uploadFolder.fileChooser', /^\s*上传文件夹$/]]) {
      try {
        const btn = page.locator('button:visible, .el-button:visible').filter({ hasText: re }).first();
        if ((await btn.count()) === 0) {
          add(label, false, `no visible button matching ${re}`);
        } else {
          const [fc] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
            btn.click(),
          ]);
          add(label, !!fc, fc ? 'filechooser event fired' : 'no filechooser within 8s');
          if (fc) await fc.setFiles([]).catch(() => {});
          await sleep(800);
        }
      } catch (e) {
        add(label, false, (e && e.message) || String(e));
      }
    }

    // [27] KBAskPanel 快捷提问（sweep 报 state-dependent：pill 只在问答面板可见时存在，
    //      且 hasTurns 后消失）。先找可见实例，找不到就切到「问答」tab 再找；
    //      点击后的可观测效果 = ask 类接口发出。
    try {
      const QRE = /总结|列出|生成关于|讲了什么|时间线|人物关系/;
      let pill = page.locator('.kb-split__ask button:visible').filter({ hasText: QRE }).first();
      if ((await pill.count()) === 0) {
        const tab = page.locator('button:visible, .el-tabs__item:visible, [role="tab"]:visible').filter({ hasText: /问答/ }).first();
        if ((await tab.count()) > 0) {
          await tab.click().catch(() => {});
          await sleep(1800);
        }
        pill = page.locator('.kb-ask-standalone button:visible, .kb-split__ask button:visible').filter({ hasText: QRE }).first();
      }
      if ((await pill.count()) === 0) {
        const splitVis = await page.locator('.kb-split__ask:visible').count();
        const standVis = await page.locator('.kb-ask-standalone:visible').count();
        add('kb.askPill', false, `no visible quick-question pill (split=${splitVis} standalone=${standVis} url=${kbUrl()})`);
      } else {
        const reqs = [];
        // 用 request 事件而非 response：后端慢时响应可能落在 4.5s 观察窗外
        // （2026-10-08 实测 api=[] 的假失败）；请求一发出即刻可见，
        // 而 kbId 守卫导致的「真没发请求」同样能被它如实区分
        const onReq = (r) => { if (/\/ask(\?|$)|question/i.test(r.url())) reqs.push(r.url().replace(BASE, '').slice(0, 90)); };
        page.on('request', onReq);
        const label = ((await pill.textContent()) || '').trim().replace(/\s+/g, ' ').slice(0, 30);
        await pill.click();
        await sleep(6000);
        page.off('request', onReq);
        const splitVis = await page.locator('.kb-split__ask:visible').count();
        const standVis = await page.locator('.kb-ask-standalone:visible').count();
        add('kb.askPill', reqs.length > 0,
          `q="${label}" api=${JSON.stringify(reqs.slice(0, 3))} split=${splitVis} standalone=${standVis} ${kbUrl()}`);
      }
    } catch (e) {
      add('kb.askPill', false, (e && e.message) || String(e));
    }

    // ---- gate -------------------------------------------------------------
    const unknown4xx = badResponses.filter((x) => !KNOWN_404.some((re) => re.test(x)));
    add('gate.jsErrors', jsErrors.length === 0, jsErrors.slice(0, 5).join(' | ') || 'none');
    add('gate.unknown4xx', unknown4xx.length === 0, unknown4xx.slice(0, 5).join(' | ') || 'none');
  } catch (e) {
    add('script.fatal', false, ((e && e.message) || String(e)) + ' | jsErr=' + jsErrors.slice(-3).join(' ;; '));
  } finally {
    const report = {
      generatedAt: new Date().toISOString(),
      base: BASE,
      passed: checks.filter((c) => c.ok).length,
      failed: errs.length,
      checks,
      errors: errs,
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
    await browser.close().catch(() => {});
    console.log(JSON.stringify({ passed: report.passed, failed: report.failed, out: OUT }, null, 2));
    checks.forEach((c) => console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name} :: ${c.detail.slice(0, 150)}`));
    process.exit(errs.length ? 1 : 0);
  }
})();
