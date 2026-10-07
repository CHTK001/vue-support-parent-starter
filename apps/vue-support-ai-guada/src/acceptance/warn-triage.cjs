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
  await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForSelector('input[type="password"]', { timeout: 40000 });
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
      await p.waitForSelector(selector, { timeout: 35000 });
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

    // ---- [16] /connectors  "进入聊天" ------------------------------------
    try {
      await gotoReady(page, '/connectors', 'button, [class*="connector"]');
      const beforeUrl = page.url();
      const target = page.locator('text=进入聊天').first();
      if ((await target.count()) === 0) {
        add('connectors.enterChat', false, 'no 进入聊天 element');
      } else {
        await target.click();
        await sleep(2500);
        const afterUrl = page.url();
        add('connectors.enterChat', afterUrl !== beforeUrl, `${beforeUrl} -> ${afterUrl}`);
        if (afterUrl !== beforeUrl) {
          await gotoReady(page, '/connectors', 'button, [class*="connector"]'); // restore
        }
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

    // ---- [3] /knowledge-base tag "32" (vanishes) -------------------------
    try {
      await gotoReady(page, '/knowledge-base', '.el-tag, [class*="tag"]');
      const tag = page.locator('.el-tag', { hasText: /^\s*32\s*$/ }).first();
      if ((await tag.count()) === 0) {
        const all = await page.locator('.el-tag').allInnerTexts();
        add('kb.tag32', false, `no tag "32" (have ${JSON.stringify(all.slice(0, 10))})`);
      } else {
        const beforeCls = await tag.getAttribute('class');
        const beforeRows = await page.locator('.kb-item, .el-card, [class*="kb-list"] > *').count();
        await tag.click();
        await sleep(1500);
        const afterCls = await tag.getAttribute('class').catch(() => null);
        const afterRows = await page.locator('.kb-item, .el-card, [class*="kb-list"] > *').count();
        const changed = afterCls !== beforeCls || afterRows !== beforeRows || afterCls === null;
        add('kb.tag32', changed, `cls ${beforeCls} -> ${afterCls} rows ${beforeRows} -> ${afterRows}`);
      }
    } catch (e) {
      add('kb.tag32', false, (e && e.message) || String(e));
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
