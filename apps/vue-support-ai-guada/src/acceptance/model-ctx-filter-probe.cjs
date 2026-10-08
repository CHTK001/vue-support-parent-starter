/**
 * 定向验收：上下文大小过滤（模型选择卡片 + 模型管理共用一套常用档位标签）。
 *
 * 背景：两处过滤入口都依赖登录态（聊天页 / 模型管理页），为免登录、可重复地验证
 * "标签渲染 → 点击过滤 → 再次点击取消 → 并集 → 无匹配提示 → 行尾徽标" 的完整交互，
 * 本探针跑在临时夹具页 `model-ctx-filter-check.html`（同页挂载**真实**组件
 * ModelSelectorPanel + ModelsProviderDetail + 夹具模型数据）上；最终 dist 另跑全套件回归。
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
  const selRows = page.locator('.model-panel .model-item');
  const detChips = page.locator('.d-section-head .ctx-tag');
  const detCards = page.locator('.model-grid .mc');

  const chipTexts = async (loc) => (await loc.allTextContents()).map((s) => s.trim());

  const rowInfo = () => page.$$eval('.model-panel .model-item', (rows) => rows.map((r) => ({
    name: (r.querySelector('.flex-1 > div')?.textContent || '').trim(),
    ctx: (r.querySelector('.model-ctx')?.textContent || '').trim(),
  })));

  const clickSel = async (label) => {
    await page.locator('.model-panel .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(220);
  };
  const clickDet = async (label) => {
    await page.locator('.d-section-head .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(220);
  };

  // ── 1) 标签渲染：两处都是同一套 6 个常用档位 ──
  const selLabels = await chipTexts(selChips);
  const detLabels = await chipTexts(detChips);
  add('tags.selector.rendered', JSON.stringify(selLabels) === JSON.stringify(CHIP_LABELS), selLabels.join('|'));
  add('tags.detail.rendered', JSON.stringify(detLabels) === JSON.stringify(CHIP_LABELS), detLabels.join('|'));

  // ── 2) 默认不过滤：6 行 + 徽标（含指标表回退与未知不占位） ──
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

  // ── 3) 单标签过滤 + 选中态 + 再点取消 ──
  await clickSel('≥1M');
  const t1 = await rowInfo();
  add('filter.gte1m.rows1', t1.length === 1 && t1[0].name === 'huge-1m', t1.map((r) => r.name).join('|'));
  const gte1mActive = await page.locator('.model-panel .ctx-tag', { hasText: '≥1M' }).first()
    .evaluate((el) => el.classList.contains('ctx-tag-active'));
  add('filter.gte1m.chipActive', gte1mActive, 'active=' + gte1mActive);

  await clickSel('≥1M');
  add('filter.gte1m.toggleOff', (await rowInfo()).length === 6, 'rows=' + (await rowInfo()).length);

  // ── 4) 「未知」档只匹配无上下文数据的模型 ──
  await clickSel('未知');
  const t2 = await rowInfo();
  add('filter.unknown.onlyMystery', t2.length === 1 && t2[0].name === 'mystery', t2.map((r) => r.name).join('|'));
  await clickSel('未知');
  add('filter.unknown.toggleOff', (await rowInfo()).length === 6, 'rows=' + (await rowInfo()).length);

  // ── 5) 多选 = 并集 ──
  await clickSel('32K-128K');
  await clickSel('128K-256K');
  const t3 = (await rowInfo()).map((r) => r.name).sort();
  add('filter.multi.union', JSON.stringify(t3) === JSON.stringify(['mid-128k', 'small-32k']), t3.join('|'));
  await clickSel('32K-128K');
  await clickSel('128K-256K');
  add('filter.multi.cleared', (await rowInfo()).length === 6, 'rows=' + (await rowInfo()).length);

  // ── 6) 区间下界：4096 落 <32K；32000 落 32K-128K（[min,max) 语义） ──
  await clickSel('<32K');
  const t4 = (await rowInfo()).map((r) => r.name);
  add('filter.lt32k.onlyMini', JSON.stringify(t4) === JSON.stringify(['mini-4k']), t4.join('|'));
  await clickSel('<32K');
  add('filter.lt32k.cleared', (await rowInfo()).length === 6, 'rows=' + (await rowInfo()).length);

  // ── 7) 过滤不吞点击：点行仍能选中 ──
  await page.locator('.model-panel .model-item', { hasText: 'small-32k' }).first().click();
  await page.waitForTimeout(200);
  const picked = await page.evaluate(() => window.__picked || []);
  add('select.rowStillWorks', picked.includes('p1:small-32k'), JSON.stringify(picked));

  // ── 8) 模型管理：过滤 + 计数 + 卡片回退显示 ──
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

  // ── 9) 变体页：单模型 → 选择卡片不渲染标签行（无需过滤）；模型管理仍可过滤 ──
  await page.goto(`${BASE}${HARNESS}?only=huge-1m`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.model-panel', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('.d-section-head', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(300);
  add('variant.single.rows1', (await page.locator('.model-panel .model-item').count()) === 1,
    'rows=' + (await page.locator('.model-panel .model-item').count()));
  add('variant.single.selectorChipsHidden', (await page.locator('.model-panel .ctx-tag').count()) === 0,
    'chips=' + (await page.locator('.model-panel .ctx-tag').count()));
  add('variant.single.detailChips6', (await page.locator('.d-section-head .ctx-tag').count()) === 6,
    'chips=' + (await page.locator('.d-section-head .ctx-tag').count()));

  await page.locator('.d-section-head .ctx-tag', { hasText: '<32K' }).first().click();
  await page.waitForTimeout(220);
  add('variant.single.detailNoMatch',
    (await page.locator('.model-grid .mc').count()) === 0
    && (await page.locator('#detail-host .ctx-no-match').isVisible()),
    'cards=' + (await page.locator('.model-grid .mc').count()));

  // ── 10) 变体页：两个模型都不命中 → 两处都出现「无匹配」提示 ──
  await page.goto(`${BASE}${HARNESS}?variant=nomatch`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.model-panel', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('.d-section-head', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(300);
  add('variant.nomatch.rows2', (await page.locator('.model-panel .model-item').count()) === 2,
    'rows=' + (await page.locator('.model-panel .model-item').count()));

  await page.locator('.model-panel .ctx-tag', { hasText: '≥1M' }).first().click();
  await page.waitForTimeout(220);
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
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(2);
});
