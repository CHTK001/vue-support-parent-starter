/**
 * 定向验收：模型选择卡片**检索框**（2026-10-09 用户需求改版）+ 模型管理档位过滤。
 *
 * 背景与分工：
 *   - 模型选择卡片：应用户要求**移除上下文大小过滤标签**，改为检索框
 *     （按「显示名 / 裸模型名 / 供应商名」即时过滤，不区分大小写；行尾上下文徽标保留展示）。
 *   - 模型管理页（ModelsProviderDetail）：**保留**常用档位标签过滤（.d-section-head .ctx-tag）。
 *   - 本探针跑在临时夹具页 `model-ctx-filter-check.html`（挂载**真实**组件
 *     ModelSelectorPanel + ModelsProviderDetail + 夹具模型数据），免登录、可重复；
 *   - 真实应用上的同口径校验见 model-ctx-filter-app-check.cjs；最终 dist 另跑全套件回归。
 *
 * 用法：node src/acceptance/model-ctx-filter-probe.cjs
 *   BASE 默认 http://localhost:15692（自查专用 dev server）
 *   夹具页：{BASE}/src/acceptance/model-ctx-filter-check.html[?only=huge-1m]
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:15692';
const HARNESS = '/src/acceptance/model-ctx-filter-check.html';

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail == null ? '' : detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} :: ${detail}`);
};

// 模型管理侧仍保留的 6 个常用档位标签
const CHIP_LABELS = ['<32K', '32K-128K', '128K-256K', '256K-1M', '≥1M', '未知'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });

  await page.goto(`${BASE}${HARNESS}`, { waitUntil: 'networkidle', timeout: 60000 });

  // ── 就绪：两个宿主都挂上 ──
  await page.waitForSelector('.model-panel', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('.d-section-head', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(300);

  const fixtureErrors = async () => page.evaluate(() => window.__fixtureErrors || []);
  add('boot.noFixtureErrors', (await fixtureErrors()).length === 0, JSON.stringify(await fixtureErrors()));

  const selChips = page.locator('.model-panel .ctx-tag');
  const selSearch = page.locator('.model-panel .model-search__input');
  const detChips = page.locator('.d-section-head .ctx-tag');
  const detCards = page.locator('.model-grid .mc');

  const chipTexts = async (loc) => (await loc.allTextContents()).map((s) => s.trim());

  /** 行信息：显示名 + 供应商副标题 + 上下文徽标 */
  const rowInfo = () => page.$$eval('.model-panel .model-item', (rows) => rows.map((r) => {
    const box = r.querySelector('.flex-1');
    const divs = box ? box.querySelectorAll(':scope > div') : [];
    return {
      name: (divs[0]?.textContent || '').trim(),
      provider: (divs[1]?.textContent || '').trim(),
      ctx: (r.querySelector('.model-ctx')?.textContent || '').trim(),
    };
  }));

  const typeSearch = async (kw) => {
    await selSearch.fill(kw);
    await page.waitForTimeout(220);
  };
  const clickDet = async (label) => {
    await page.locator('.d-section-head .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(220);
  };

  // ── 1) 过滤标签已从选择卡片移除；管理页仍渲染同一套 6 档 ──
  add('tags.selector.removed', (await selChips.count()) === 0, 'chips=' + (await selChips.count()));
  const detLabels = await chipTexts(detChips);
  add('tags.detail.rendered', JSON.stringify(detLabels) === JSON.stringify(CHIP_LABELS), detLabels.join('|'));

  // ── 2) 检索框渲染；默认不过滤：6 行 + 徽标（含指标表回退与未知不占位） ──
  add('search.box.rendered', (await selSearch.count()) === 1 && await selSearch.isVisible(),
    'count=' + (await selSearch.count()));
  const t0 = await rowInfo();
  add('default.rows6', t0.length === 6, 'rows=' + t0.length);
  const badgeMap = Object.fromEntries(t0.map((r) => [r.name, r.ctx]));
  add('badge.4k', badgeMap['mini-4k'] === '4K', 'mini-4k=' + badgeMap['mini-4k']);
  add('badge.32k', badgeMap['small-32k'] === '32K', 'small-32k=' + badgeMap['small-32k']);
  add('badge.128k', badgeMap['mid-128k'] === '128K', 'mid-128k=' + badgeMap['mid-128k']);
  add('badge.256k.metricsFallback', badgeMap['big-256k'] === '256K', 'big-256k=' + badgeMap['big-256k']);
  add('badge.1m', badgeMap['huge-1m'] === '1M', 'huge-1m=' + badgeMap['huge-1m']);
  add('badge.unknown.hidden', badgeMap['mystery'] === '', 'mystery=' + JSON.stringify(badgeMap['mystery']));
  add('default.favoriteFirst', t0[0]?.name === 'mid-128k', 'first=' + t0[0]?.name);

  // ── 3) 检索过滤：显示名子串命中 ──
  await typeSearch('huge');
  const t1 = await rowInfo();
  add('search.name.rows1', t1.length === 1 && t1[0].name === 'huge-1m', t1.map((r) => r.name).join('|'));

  // ── 4) 不区分大小写 ──
  await typeSearch('HUGE');
  const t2 = await rowInfo();
  add('search.caseInsensitive', t2.length === 1 && t2[0].name === 'huge-1m', t2.map((r) => r.name).join('|'));

  // ── 5) 供应商名也可命中（夹具供应商 Fixture Provider，无任何模型名含 fixture） ──
  await typeSearch('fixture');
  const t3 = await rowInfo();
  add('search.providerMatch', t3.length === 6, 'rows=' + t3.length);

  // ── 6) 裸名片段：128k 只命中 mid-128k ──
  await typeSearch('128k');
  const t4 = await rowInfo();
  add('search.subName', t4.length === 1 && t4[0].name === 'mid-128k', t4.map((r) => r.name).join('|'));

  // ── 7) 清空按钮恢复全量 ──
  await typeSearch('huge');
  await page.locator('.model-panel .model-search__clear').click();
  await page.waitForTimeout(220);
  add('search.clearBtn.restored', (await rowInfo()).length === 6, 'rows=' + (await rowInfo()).length);

  // ── 8) 无匹配 → 提示行（沿用 common.contextSize.noMatch 文案） ──
  await typeSearch('zzz-nothing-matches');
  add('search.noMatch.hint',
    (await rowInfo()).length === 0
    && (await page.locator('.model-panel .ctx-no-match').isVisible()),
    'rows=' + (await rowInfo()).length);
  await typeSearch('');

  // ── 9) 过滤清空后不吞点击：点行仍能选中 ──
  await page.locator('.model-panel .model-item', { hasText: 'small-32k' }).first().click();
  await page.waitForTimeout(200);
  const picked = await page.evaluate(() => window.__picked || []);
  add('select.rowStillWorks', picked.includes('p1:small-32k'), JSON.stringify(picked));

  // ── 10) 模型管理：档位过滤 + 计数 + 卡片回退显示 ──
  const detCount0 = (await page.locator('.d-section-head .d-section-count').textContent() || '').trim();
  add('detail.count.total', detCount0 === '6/6', 'count=' + detCount0);
  add('detail.cards6', (await detCards.count()) === 6, 'cards=' + (await detCards.count()));

  const bigCard = page.locator('.model-grid .mc', { hasText: 'big-256k' }).first();
  const bigMeta = (await bigCard.locator('.mc-meta').textContent() || '').replace(/\s+/g, ' ');
  add('detail.cardMeta.metricsFallback256K', bigMeta.includes('256K'), bigMeta.slice(0, 80));

  await clickDet('≥1M');
  add('detail.filter.gte1m.cards1', (await detCards.count()) === 1, 'cards=' + (await detCards.count()));
  const detCount1 = (await page.locator('.d-section-head .d-section-count').textContent() || '').trim();
  add('detail.filter.gte1m.count', detCount1 === '1/6', 'count=' + detCount1);
  await clickDet('≥1M');

  await clickDet('未知');
  const detUnknownName = (await detCards.first().locator('.mc-name').textContent() || '').trim();
  add('detail.filter.unknown', (await detCards.count()) === 1 && detUnknownName === 'mystery',
    'cards=' + (await detCards.count()) + ' name=' + detUnknownName);
  await clickDet('未知');

  await clickDet('32K-128K');
  await clickDet('≥1M');
  add('detail.filter.multi.union2', (await detCards.count()) === 2, 'cards=' + (await detCards.count()));
  await clickDet('32K-128K');
  await clickDet('≥1M');
  add('detail.filter.cleared', (await detCards.count()) === 6, 'cards=' + (await detCards.count()));

  // ── 11) 变体页：单模型 → 选择卡片不渲染检索框/标签行（无需检索）；模型管理仍可过滤 ──
  await page.goto(`${BASE}${HARNESS}?only=huge-1m`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.model-panel', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('.d-section-head', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(300);
  add('variant.single.rows1', (await page.locator('.model-panel .model-item').count()) === 1,
    'rows=' + (await page.locator('.model-panel .model-item').count()));
  add('variant.single.selectorChipsHidden', (await selChips.count()) === 0,
    'chips=' + (await selChips.count()));
  add('variant.single.searchHidden', (await selSearch.count()) === 0,
    'search=' + (await selSearch.count()));
  add('variant.single.detailChips6', (await page.locator('.d-section-head .ctx-tag').count()) === 6,
    'chips=' + (await page.locator('.d-section-head .ctx-tag').count()));

  await page.locator('.d-section-head .ctx-tag', { hasText: '<32K' }).first().click();
  await page.waitForTimeout(220);
  add('variant.single.detailNoMatch',
    (await page.locator('.model-grid .mc').count()) === 0
    && (await page.locator('#detail-host .ctx-no-match').isVisible()),
    'cards=' + (await page.locator('.model-grid .mc').count()));

  // ── 12) 变体页：两个模型 → 选择卡片检索无匹配提示；管理页标签无匹配提示 ──
  await page.goto(`${BASE}${HARNESS}?variant=nomatch`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.model-panel', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('.d-section-head', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(300);
  add('variant.nomatch.rows2', (await page.locator('.model-panel .model-item').count()) === 2,
    'rows=' + (await page.locator('.model-panel .model-item').count()));

  await typeSearch('zzz-nothing-matches');
  add('variant.nomatch.selectorHint',
    (await page.locator('.model-panel .model-item').count()) === 0
    && (await page.locator('.model-panel .ctx-no-match').isVisible()),
    'rows=' + (await page.locator('.model-panel .model-item').count()));

  await page.locator('.d-section-head .ctx-tag', { hasText: '≥1M' }).first().click();
  await page.waitForTimeout(220);
  add('variant.nomatch.detailHint',
    (await page.locator('.model-grid .mc').count()) === 0
    && (await page.locator('#detail-host .ctx-no-match').isVisible()),
    'cards=' + (await page.locator('.model-grid .mc').count()));

  const errsFinal = [...errs];
  add('page.noErrors', errsFinal.length === 0, JSON.stringify(errsFinal.slice(0, 3)));
  add('boot.noFixtureErrors.final', (await fixtureErrors().catch(() => [])).length === 0,
    JSON.stringify(await fixtureErrors().catch(() => [])));

  await browser.close();

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== model-ctx-filter-probe: ${checks.length - failed.length}/${checks.length} PASS =====`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  ${f.name} :: ${f.detail}`));
  }
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(2);
});
