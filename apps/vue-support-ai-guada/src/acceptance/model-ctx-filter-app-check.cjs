/**
 * 业务级验收：上下文大小过滤在**真实应用**中的表现（聊天页模型选择卡片 + 模型管理）。
 *
 * 与夹具探针（model-ctx-filter-probe.cjs）分工：
 *   - 夹具探针：全档位矩阵、并集/取消/无匹配等交互语义，跑在私有 dev 夹具页（免登录）；
 *   - 本探针：跑在**真实应用**（本地 pnpm dev，默认代理远端 198:8787）上，用线上真实模型
 *     数据校验"标签渲染 → 点击过滤 → 可见行与其上下文徽标自洽 → 再点恢复"，
 *     以及模型管理页的同类行为。属于浏览器业务验收，不依赖夹具。
 *
 * 用法：BASE=http://localhost:15689 node src/acceptance/model-ctx-filter-app-check.cjs
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:15689';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail == null ? '' : detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} :: ${detail}`);
};

// 标签文案 ↔ 档位 key（与 locales 的 common.contextSize 一致）
const LABEL_TO_KEY = {
  '<32K': 'lt32k',
  '32K-128K': 'k32to128',
  '128K-256K': 'k128to256',
  '256K-1M': 'k256to1m',
  '≥1M': 'gte1m',
  '未知': 'unknown',
};
const BANDS = {
  lt32k: [0, 32000],
  k32to128: [32000, 128000],
  k128to256: [128000, 256000],
  k256to1m: [256000, 1000000],
  gte1m: [1000000, Infinity],
};

/** 徽标文本 → token 数（4K/32K/128K/256K/1M/1.5M） */
function badgeToTokens(text) {
  const t = (text || '').trim();
  if (!t) return null;
  const m = /^([\d.]+)([KM])$/.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 'M' ? Math.round(n * 1000000) : Math.round(n * 1000);
}

/** 可见行是否都自洽于当前选中的档位（并集语义；无徽标=未知） */
function rowsConsistentWithBands(rows, keys) {
  const bands = keys.map((k) => BANDS[k]).filter(Boolean);
  const wantUnknown = keys.includes('unknown');
  for (const r of rows) {
    const tokens = badgeToTokens(r.ctx);
    if (tokens === null) {
      if (!wantUnknown) return { ok: false, why: `未知行在已知档位筛选下仍可见: ${r.name}` };
      continue;
    }
    const inBand = bands.some(([lo, hi]) => tokens >= lo && tokens < hi);
    if (!inBand) return { ok: false, why: `行 ${r.name}(${r.ctx}) 不在所选档位内` };
  }
  return { ok: true };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  const errs = [];
  const asset404 = [];
  const apiErrors = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // 静态资源 404 的 console 噪音不计入（仓内既有套件同口径，见 hover-popover-check.cjs）；
    // 但仍单独记录 URL，便于确认不是「本该显示却裂图」的业务缺陷。
    if (/Failed to load resource/.test(m.text())) return;
    errs.push('console: ' + m.text().slice(0, 160));
  });
  page.on('response', (r) => {
    if (r.status() < 400) return;
    const path = new URL(r.url()).pathname;
    // 只把「应用自己的后端命名空间」的 4xx/5xx 当失败：共享框架包的天气/定位模块
    // 按设计先探本地代理（/weather-api、/geo-api 等），本部署无该代理 → 404 后
    // 回退公网源，属预期行为，不应算业务缺陷。
    if (/^\/(api|v2)\//.test(path)) {
      apiErrors.push(r.status() + ' ' + path);
    } else {
      asset404.push(r.status() + ' ' + path);
    }
  });

  // ── 登录 ──
  // ── 登录 ──
  // dev（vite 按需编译）下"登录页提交 → 懒加载整棵应用树"经常超过 4 分钟不稳定，
  // 会让业务断言卡在登录跳转上（实测 2026-10-08：240s 超时，URL 在 /login 反复）。
  // 改为：先走接口取令牌并注入 localStorage（与应用同一存储键），直接进站；
  // 若进站仍被弹回 /login，再退回 UI 填表登录。
  const apiLogin = async () => {
    const resp = await page.request.post(BASE + '/v2/user/login', {
      data: { username: USER, password: PASS },
      timeout: 30000,
    });
    const body = await resp.json().catch(() => ({}));
    return body?.data?.accessToken || '';
  };
  const uiLogin = async () => {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('input[type="password"]', { timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.locator('input[type="text"]').first().fill(USER);
    await page.locator('input[type="password"]').first().fill(PASS);
    await page.locator('button:has-text("登")').first().click();
    await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 240000 });
  };

  let token = '';
  try {
    token = await apiLogin();
  } catch { /* 走 UI 兜底 */ }
  add('login.tokenFetched', !!token, 'tokenLen=' + token.length);
  if (token) {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(([t, u]) => {
      // 与 LoginPage 写入的存储键一致（值为 JSON 字符串，见 stores/token）
      localStorage.setItem('ai-guada:accessToken', JSON.stringify(t));
      localStorage.setItem('ai-guada:userInfo', JSON.stringify({ userId: u, username: u, nickname: u }));
    }, [token, USER]);
  }
  await page.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForTimeout(2500);
  if (/\/login/.test(new URL(page.url()).pathname)) {
    // 注入没吃住（或令牌无效）→ 退回 UI 登录
    await uiLogin();
    await page.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForTimeout(1500);
  }
  add('login.ok', !/\/login/.test(new URL(page.url()).pathname), 'url=' + page.url());

  // ── A. 聊天页：打开模型选择卡片 ──
  await page.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 180000 });
  const trigger = page.locator('button.model-selector-btn').first();
  await trigger.waitFor({ state: 'visible', timeout: 180000 });
  // 配置就绪门：未就绪时按钮文本是「+ 添加模型」，点击走加模型分支、面板永不出现
  let btnText = '';
  for (let i = 0; i < 30; i++) {
    btnText = ((await trigger.textContent().catch(() => '')) || '').trim();
    if (btnText && !/添加模型/.test(btnText)) break;
    await page.waitForTimeout(1000);
  }
  add('app.panel.triggerReady', !!btnText && !/添加模型/.test(btnText), 'btnText=' + btnText);
  await trigger.click();
  await page.waitForSelector('.model-panel', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(400);

  const panelChips = page.locator('.model-panel .ctx-tag');
  const panelRows = page.locator('.model-panel .model-item');
  const chipLabels = (await panelChips.allTextContents()).map((s) => s.trim());
  const initialRows = await panelRows.count();
  add('app.panel.opened', true, `chips=${chipLabels.length} rows=${initialRows}`);
  add('app.panel.rowsPresent', initialRows > 0, 'rows=' + initialRows);
  add('app.panel.chipsValid',
    chipLabels.length > 0 && chipLabels.every((l) => LABEL_TO_KEY[l]),
    chipLabels.join('|'));

  const readRows = () => page.$$eval('.model-panel .model-item', (rows) => rows.map((r) => ({
    name: (r.querySelector('.flex-1 > div')?.textContent || '').trim(),
    ctx: (r.querySelector('.model-ctx')?.textContent || '').trim(),
  })));

  // 取一个"有可见结果"的档位来验证过滤自洽；逐个试，保证用真实数据也能命中
  let verifiedKey = null;
  for (const label of chipLabels) {
    const key = LABEL_TO_KEY[label];
    const before = await panelRows.count();
    await page.locator('.model-panel .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(300);
    const filtered = await readRows();
    if (filtered.length > 0) {
      const cons = rowsConsistentWithBands(filtered, [key]);
      add(`app.panel.filter[${label}].consistent`, cons.ok, cons.why || `rows=${filtered.length} (before=${before})`);
      add(`app.panel.filter[${label}].subset`, filtered.length <= before, `${filtered.length}<=${before}`);
      verifiedKey = key;
      // 再点一次取消，恢复
      await page.locator('.model-panel .ctx-tag', { hasText: label }).first().click();
      await page.waitForTimeout(300);
      const restored = await panelRows.count();
      add(`app.panel.filter[${label}].restored`, restored === before, `restored=${restored} before=${before}`);
      break;
    }
    // 没命中就取消后换下一个
    await page.locator('.model-panel .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(200);
  }
  add('app.panel.someBandVerified', !!verifiedKey, 'verifiedBand=' + verifiedKey);

  // 关闭弹层
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── B. 模型管理：供应商详情的同一套标签 ──
  await page.goto(BASE + '/models', { waitUntil: 'domcontentloaded', timeout: 180000 });
  // 默认选中的供应商可能是无模型者（如 onnx）→ 详情显示空态而非区块头；
  // 这里先等详情区出现，若为空态就切到有模型的供应商（gavinchen/agnes）。
  await page.waitForSelector('.d-empty, .d-section-head', { state: 'visible', timeout: 240000 });
  if (await page.locator('.d-empty').count() > 0) {
    for (const name of ['gavinchen', 'agnes', 'Agnes']) {
      try {
        await page.locator(`text=${name}`).first().click({ timeout: 8000 });
        await page.waitForTimeout(2500);
        if (await page.locator('.d-section-head').count() > 0) break;
      } catch { /* 换下一个供应商名 */ }
    }
  }
  await page.waitForSelector('.d-section-head', { state: 'visible', timeout: 60000 });
  await page.waitForTimeout(600);

  const mgChips = page.locator('.d-section-head .ctx-tag');
  const mgCards = page.locator('.model-grid .mc');
  const mgLabels = (await mgChips.allTextContents()).map((s) => s.trim());
  const mgInitial = await mgCards.count();
  add('app.mg.chipsValid',
    mgLabels.length > 0 && mgLabels.every((l) => LABEL_TO_KEY[l]),
    `chips=${mgLabels.length} labels=${mgLabels.join('|')}`);
  add('app.mg.cardsPresent', mgInitial > 0, 'cards=' + mgInitial);

  const readCards = () => page.$$eval('.model-grid .mc', (cards) => cards.map((c) => ({
    name: (c.querySelector('.mc-name')?.textContent || '').trim(),
    meta: (c.querySelector('.mc-meta')?.textContent || '').replace(/\s+/g, ' ').trim(),
  })));

  const mgCount0 = (await page.locator('.d-section-head .d-section-count').textContent() || '').trim();
  add('app.mg.count.total', mgCount0 === `${mgInitial}/${mgInitial}`, 'count=' + mgCount0);

  let mgVerified = false;
  for (const label of mgLabels) {
    const key = LABEL_TO_KEY[label];
    await page.locator('.d-section-head .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(350);
    const cards = await readCards();
    const cnt = (await page.locator('.d-section-head .d-section-count').textContent() || '').trim();
    // 卡片 meta 里的"输入 256K"就是上下文；逐卡核对（缺 meta 视为未知）
    const inconsistent = [];
    for (const c of cards) {
      const m = /输入\s*([\d.]+[KM])/.exec(c.meta);
      const tokens = m ? badgeToTokens(m[1]) : null;
      if (tokens === null) {
        if (key !== 'unknown') inconsistent.push(`${c.name}: 无上下文但档位=${label}`);
        continue;
      }
      if (key === 'unknown') { inconsistent.push(`${c.name}: 有上下文(${tokens})但档位=未知`); continue; }
      const [lo, hi] = BANDS[key];
      if (!(tokens >= lo && tokens < hi)) inconsistent.push(`${c.name}: ${tokens} 不在 ${label}`);
    }
    const countOk = cnt === `${cards.length}/${mgInitial}`;
    if (cards.length > 0 || key === 'unknown') {
      add(`app.mg.filter[${label}].consistent`, inconsistent.length === 0,
        inconsistent.slice(0, 3).join('; ') || `cards=${cards.length} count=${cnt}`);
      add(`app.mg.filter[${label}].countBadge`, countOk, `count=${cnt}`);
      mgVerified = true;
      await page.locator('.d-section-head .ctx-tag', { hasText: label }).first().click();
      await page.waitForTimeout(300);
      const restored = await mgCards.count();
      add(`app.mg.filter[${label}].restored`, restored === mgInitial, `restored=${restored} initial=${mgInitial}`);
      break;
    }
    await page.locator('.d-section-head .ctx-tag', { hasText: label }).first().click();
    await page.waitForTimeout(250);
  }
  add('app.mg.someBandVerified', mgVerified, 'verified=' + mgVerified);

  add('app.noPageErrors', errs.length === 0, JSON.stringify(errs.slice(0, 3)));
  // 非静态资源的 4xx/5xx 才算接口层失败（静态图片 404 只记录 URL，见下）
  add('app.noApiErrors', apiErrors.length === 0, JSON.stringify([...new Set(apiErrors)].slice(0, 5)));
  console.log('INFO  非后端命名空间 4xx/5xx（静态资源 / 框架回退探测，仅记录不计失败）:',
    JSON.stringify([...new Set(asset404)].slice(0, 8)));

  await browser.close();
  const failed = checks.filter((c) => !c.ok);
  console.log(`\n===== model-ctx-filter-app-check: ${checks.length - failed.length}/${checks.length} PASS =====`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(2);
});
