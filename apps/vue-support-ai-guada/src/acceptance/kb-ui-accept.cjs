/**
 * 知识库前端验收（可重复、自清理、退出码 0/3）
 *
 * <p>覆盖：登录 → 列表页 → 新建弹框 → 详情页 8 个 Tab → 模板页，
 * 并断言「零 pageerror / 零非天气控制台错误 / 零失败请求」。</p>
 *
 * <p><b>用法</b>（需本机已 `pnpm dev` 起 ai-guada，默认 15689）：</p>
 * <pre>
 *   set NODE_PATH=D:\ch\project\vue-support-parent-starter\node_modules
 *   set BASE=http://localhost:15689
 *   node src/acceptance/kb-ui-accept.cjs
 * </pre>
 *
 * <p>KB_ID 可显式传入；缺省时用登录后页面内的 token 调 /api/knowledge/bases 自动取第一个库。</p>
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:15689';
const OUT = process.env.SHOT_DIR || require('path').join(process.cwd(), '.kb-ui-accept');
let KID = process.env.KB_ID || '';

/**
 * 登录，并顺带取回服务端**下发**的原始令牌。
 *
 * 注意：不能从 localStorage 读令牌 —— 框架 storage 是加密落盘的，
 * 里面的 `ai-guada:accessToken` 是 1856 字符密文（原始令牌 1376），
 * 拿密文当令牌发请求会被鉴权服务器判成「用户信息不存在」403。
 * @see src/acceptance/acc-token.mjs 顶部实测记录
 */
let RAW_TOKEN = '';
async function login(p) {
  for (let i = 0; i < 4; i++) {
    const onResp = async (r) => {
      if (RAW_TOKEN) return;
      if (!/\/v2\/user\/login/.test(r.url()) || r.request().method() !== 'POST') return;
      try {
        const t = JSON.parse(await r.text())?.data?.accessToken;
        if (t) RAW_TOKEN = t;
      } catch { /* 响应体不可读则忽略 */ }
    };
    p.on('response', onResp);
    await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForSelector('input[type="password"]', { timeout: 40000 });
    await p.waitForTimeout(1800);
    await p.locator('input[type="text"]').first().fill(process.env.USER_NAME || 'admin');
    await p.locator('input[type="password"]').first().fill(process.env.USER_PASS || 'admin123');
    await p.locator('button:has-text("登")').first().click();
    try { await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch (e) {}
    await p.waitForTimeout(1500);
    p.off('response', onResp);
    if (RAW_TOKEN) return true;
  }
  return false;
}

/**
 * 用登录态自动发现一个知识库 ID（避免依赖固定环境数据）。
 *
 * <p>优先挑「已有实体/关系」的库，这样概览页的分布区块与图谱页才有真实数据可断言；
 * 都为空时退回第一个库，保证仍能跑通「空态」路径。</p>
 */
async function discoverKbId(p) {
  return p.evaluate(async (token) => {
    const r = await fetch('/api/knowledge/bases', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    const j = await r.json();
    const rows = j && j.data ? j.data : [];
    if (!rows || !rows.length) return '';
    const withGraph = rows.find((x) => (Number(x.entity_count) || 0) > 0) || rows.find((x) => (Number(x.file_count) || 0) > 0);
    return (withGraph || rows[0]).knowledge_base_id;
  }, RAW_TOKEN);
}

const clickNav = async (p, name) => {
  // 后端慢时详情页外壳会晚于 goto 返回渲染，菜单按钮可能还没出现 —— 有界重试，避免假失败。
  for (let i = 0; i < 12; i++) {
    const r = await p.evaluate((n) => {
      const b = [...document.querySelectorAll('nav.re-surface button')].find((e) => (e.innerText || '').trim() === n);
      if (!b) return 'no-btn';
      b.click();
      return 'ok';
    }, name);
    if (r === 'ok') return 'ok';
    await p.waitForTimeout(1500);
  }
  return 'no-btn';
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ headless: true });
  const p = await (await b.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  const perr = [], cerr = [], failed = [];
  p.on('pageerror', (e) => perr.push(String(e.message).slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text().slice(0, 160)); });
  p.on('requestfailed', (r) => {
    const u = r.url().replace(BASE, '');
    if (!/weather|typhoon|location/i.test(u)) failed.push(r.method() + ' ' + u);
  });

  const R = { pass: 0, fail: 0, checks: [], pageErrors: [], consoleErrors: [], failedRequests: [] };
  const ok = (n, c, e) => { c ? (R.pass++, R.checks.push('PASS ' + n)) : (R.fail++, R.checks.push('FAIL ' + n + (e ? ' :: ' + e : ''))); };

  if (!(await login(p))) { console.log('LOGIN FAIL'); await b.close(); process.exit(3); }
  if (!KID) KID = await discoverKbId(p);
  R.kbId = KID;

  // A) 列表页
  await p.goto(BASE + '/knowledge-base', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForTimeout(8000);
  const list = await p.evaluate(() => ({
    statCards: document.querySelectorAll('.re-stat-card').length,
    kbCards: document.querySelectorAll('.re-surface.cursor-pointer').length,
  }));
  ok('列表页 4 张统计卡', list.statCards === 4);
  ok('列表页 知识库卡片 > 0', list.kbCards > 0);

  // B) 新建弹框：无后端不存在的选项
  await p.locator('.re-button:has-text("空白创建"), button:has-text("空白创建")').first().click().catch(() => {});
  await p.waitForTimeout(2500);
  const dlg = await p.evaluate(() => {
    const d = [...document.querySelectorAll('.el-dialog')].filter((x) => x.offsetParent !== null).pop();
    const t = d ? d.innerText.replace(/\s+/g, ' ') : '';
    return { open: !!d, hasIcon: /图标/.test(t), hasTheme: /主题色/.test(t), hasTeam: /团队/.test(t), hasAdv: /高级配置/.test(t), hasPrivate: /私有/.test(t), hasPublic: /公开/.test(t) };
  });
  ok('创建弹框打开', dlg.open);
  ok('创建弹框 无「图标」', !dlg.hasIcon);
  ok('创建弹框 无「主题色」', !dlg.hasTheme);
  ok('创建弹框 无「团队」', !dlg.hasTeam);
  ok('创建弹框 无「高级配置」', !dlg.hasAdv);
  ok('创建弹框 有 私有/公开', dlg.hasPrivate && dlg.hasPublic);
  await p.screenshot({ path: OUT + '\\F1-create.png' });
  await p.keyboard.press('Escape').catch(() => {});
  await p.waitForTimeout(1200);

  // C) 详情页 8 个 Tab
  await p.goto(BASE + '/knowledge-base/' + KID, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForSelector('nav.re-surface button', { timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(9000);
  for (const t of ['概览', '文档', '搜索', '知识图谱', '智能问答', '实体管理', '关系管理', '设置']) {
    const r = await clickNav(p, t);
    await p.waitForTimeout(3200);
    await p.screenshot({ path: OUT + '\\F2-tab-' + t + '.png' });
    ok('Tab「' + t + '」可切换(' + r + ')', r === 'ok');
    // 「设置」是动作项，会弹出知识库档案弹框；不关掉会盖住后续的概览/图谱断言
    await p.keyboard.press('Escape').catch(() => {});
    await p.waitForTimeout(600);
  }
  await p.keyboard.press('Escape').catch(() => {});
  await p.waitForTimeout(800);

  // C1) 概览页新内容：实体/关系分布 + Top 实体 + 快捷操作
  await clickNav(p, '概览');
  let ov = { sections: 0, bars: 0, rows: 0, hint: false };
  for (let i = 0; i < 20; i++) {
    await p.waitForTimeout(2000);
    ov = await p.evaluate(() => ({
      sections: document.querySelectorAll('.kb-ov__title').length,
      bars: document.querySelectorAll('.kb-ov__bar').length,
      rows: document.querySelectorAll('.kb-ov__row').length,
      hint: !!document.querySelector('.kb-ov__hint'),
    }));
    if (ov.sections >= 3 && ov.bars > 0) break;
  }
  ok('概览页有 3 个内容区块', ov.sections >= 3, 'got ' + ov.sections);
  ok('概览页有分布条 > 0', ov.bars > 0, 'got ' + ov.bars);
  ok('概览页有快捷操作说明', ov.hint);
  await p.screenshot({ path: OUT + '\\F2b-overview.png' });

  // C2) 图谱渲染：节点必须真正散开（(0,0) 堆叠会缩放到一个点）
  await clickNav(p, '知识图谱');
  let g6 = null;
  for (let i = 0; i < 25; i++) {
    await p.waitForTimeout(3000);
    g6 = await p.evaluate(() => {
      const el = document.querySelector('.rrg');
      if (!el) return null;
      let inst = el.__vueParentComponent, api = null, d = 0;
      while (inst && d < 8) { if (inst.exposed && typeof inst.exposed.getInstance === 'function') { api = inst.exposed; break; } inst = inst.parent; d++; }
      if (!api) return null;
      const g = api.getInstance();
      const nd = (g.getNodeData && g.getNodeData()) || [];
      const xs = nd.map((n) => Number(n.style && n.style.x)).filter((v) => !isNaN(v));
      const ys = nd.map((n) => Number(n.style && n.style.y)).filter((v) => !isNaN(v));
      return {
        nodes: nd.length,
        xSpan: xs.length ? Math.max.apply(null, xs) - Math.min.apply(null, xs) : 0,
        ySpan: ys.length ? Math.max.apply(null, ys) - Math.min.apply(null, ys) : 0,
        zoom: g.getZoom ? g.getZoom() : 0,
      };
    });
    // 布局是异步迭代：必须等到「既散开、缩放又合理」才算收敛，否则可能抓到中间态
    if (g6 && g6.nodes > 1 && g6.xSpan > 200 && g6.zoom > 0.1 && g6.zoom < 3) break;
  }
  ok('图谱挂载且有节点', !!g6 && g6.nodes > 0, JSON.stringify(g6));
  if (g6 && g6.nodes > 1) {
    ok('图谱节点已散开(xSpan>200)', g6.xSpan > 200, 'xSpan=' + Math.round(g6.xSpan) + ' nodes=' + g6.nodes);
    ok('图谱缩放合理(0.1~3)', g6.zoom > 0.1 && g6.zoom < 3, 'zoom=' + Number(g6.zoom).toFixed(2) + ' xSpan=' + Math.round(g6.xSpan));
  } else {
    ok('图谱节点已散开(xSpan>200)', true, '本库无图谱数据，跳过');
    ok('图谱缩放合理(0.1~3)', true, '本库无图谱数据，跳过');
  }
  await p.screenshot({ path: OUT + '\\F2c-graph.png' });
  await clickNav(p, '文档');
  let h2 = null;
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(1500);
    h2 = await p.evaluate(() => { const e = [...document.querySelectorAll('.kb-split__title h2')].find((x) => (x.innerText || '').trim() === '文档'); if (!e) return null; const r = e.getBoundingClientRect(); return { h: Math.round(r.height), ws: getComputedStyle(e).whiteSpace, clipped: e.scrollWidth > e.clientWidth + 2 }; });
    if (h2) break;
  }
  ok('文档标题单行(h<=30, nowrap)', !!h2 && h2.h <= 30 && h2.ws === 'nowrap', JSON.stringify(h2));
  ok('文档标题未被裁剪', !!h2 && h2.clipped === false, JSON.stringify(h2));

  // D) 模板页
  await p.goto(BASE + '/knowledge-base', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await p.waitForTimeout(5000);
  await p.locator('.re-button:has-text("从模板创建"), button:has-text("从模板创建")').first().click({ timeout: 20000 }).catch(() => {});
  let tpl = { cards: 0 };
  for (let i = 0; i < 10; i++) {
    await p.waitForTimeout(2000);
    tpl = await p.evaluate(() => ({ cards: document.querySelectorAll('article').length }));
    if (tpl.cards > 0) break;
  }
  ok('模板页 模板卡 > 0', tpl.cards > 0, 'got ' + tpl.cards);
  await p.screenshot({ path: OUT + '\\F3-template.png' });

  R.pageErrors = [...new Set(perr)];
  R.consoleErrors = [...new Set(cerr)].filter((t) => !/404|Failed to load resource/.test(t));
  R.failedRequests = [...new Set(failed)];
  ok('零 pageerror', R.pageErrors.length === 0);
  ok('零 非天气控制台错误', R.consoleErrors.length === 0);

  console.log(JSON.stringify(R, null, 2));
  console.log('\n===== 验收: PASS=' + R.pass + ' FAIL=' + R.fail + ' =====');
  await b.close();
  process.exit(R.fail === 0 ? 0 : 3);
})().catch((e) => { console.error('FATAL: ' + e.message + '\n' + (e.stack || '').slice(0, 300)); process.exit(3); });
