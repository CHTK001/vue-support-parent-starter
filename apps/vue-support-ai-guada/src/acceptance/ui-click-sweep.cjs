/**
 * 全应用「可点击元素」逐个可用性验收（生产级遍历，不抽样）。
 *
 * 需求原话是「每个可以点击的按钮，图标都要测试」，所以这里按**路由**铺开：
 * 遍历 main.js 里注册的全部页面，把每个页面上每一个可点元素逐个断言一遍。
 * 只测「我最近改的那几个页面」等于没测 —— 生产事故从来不挑页面。
 *
 * 每个可点元素判四件事：
 *   1. 可见可点：尺寸非零、未被 display/visibility/opacity 隐藏；
 *   2. 有可访问名：aria-label / title / 文字内容三选一 ——
 *      纯图标按钮没有名字，屏幕阅读器读不出来，鼠标用户也只能靠猜；
 *   3. 点得动：不是 disabled 挡死、没有被别的元素遮挡（intercepts pointer events）；
 *   4. 点完**不炸**：无 pageerror、无非噪声控制台错误、无 5xx/失败请求 ——
 *      这一条是硬失败，「点了报 500」比「点了没反应」严重得多。
 *
 * 「点了有可观测副作用」单列为 WARN 而不是 FAIL：有些按钮本就不该有副作用
 * （已是当前态的开关、禁用态的保存键、复制后只弹 tooltip），
 * 混进 FAIL 会淹掉真问题，WARN 留给人工逐条判。
 *
 * 用法（需本机已 pnpm dev 起 ai-guada，默认 15689）：
 *   set NODE_PATH=D:\ch\project\vue-support-parent-starter\node_modules
 *   set BASE=http://localhost:15689
 *   node src/acceptance/ui-click-sweep.cjs              全量
 *   node src/acceptance/ui-click-sweep.cjs /models      只跑某几个路由
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:15689';
const OUT = process.env.SWEEP_DIR || path.join(process.cwd(), '.ui-click-sweep');
const ONLY = process.argv.slice(2);

/**
 * 全部需登录路由。path 里的 :id / :tab 由 discover 阶段填实参。
 * 顺序即遍历顺序：先列表后详情，便于详情页复用列表页发现出来的 id。
 */
const ROUTES = [
  { path: '/chat/new-session', name: 'Chat', settle: 9000 },
  { path: '/characters', name: 'Characters', settle: 9000 },
  { path: '/bots', name: 'Bots', settle: 9000 },
  { path: '/tavern', name: 'Tavern', settle: 9000 },
  { path: '/setting', name: 'SystemSettings', settle: 12000 },
  { path: '/setting/default-models', name: 'DefaultModels', settle: 12000 },
  { path: '/plugins', name: 'Plugins', settle: 9000 },
  { path: '/knowledge-base', name: 'KnowledgeBaseList', settle: 9000 },
  { path: '/knowledge-base/__ID__', name: 'KnowledgeBaseDetail', settle: 12000 },
  { path: '/scheduler', name: 'Scheduler', settle: 9000 },
  { path: '/models', name: 'Models', settle: 10000 },
  { path: '/image-generate', name: 'ImageGenerate', settle: 10000 },
  { path: '/face-search', name: 'FaceSearch', settle: 12000 },
  { path: '/image-search', name: 'ImageSearch', settle: 12000 },
  { path: '/app-keys', name: 'AppKeys', settle: 9000 },
  { path: '/manufacturer-keys', name: 'ManufacturerKeys', settle: 9000 },
  { path: '/roles', name: 'Roles', settle: 9000 },
  { path: '/mcp', name: 'Mcp', settle: 9000 },
  { path: '/agents', name: 'Agents', settle: 9000 },
  { path: '/usage', name: 'Usage', settle: 10000 },
  { path: '/usage/sync-logs', name: 'UsageSyncLogs', settle: 9000 },
  { path: '/skills', name: 'Skills', settle: 9000 },
  { path: '/connectors', name: 'Connectors', settle: 9000 },
  { path: '/connectors/chat/__CONN__', name: 'ConnectorChat', settle: 12000 },
  { path: '/capabilities/ocr', name: 'CapabilityOCR', settle: 12000 },
];

/**
 * 点下去会破坏验收环境或直接登出，必须跳过。
 * 「登出」跳走后面所有元素都点不动（会话没了），一个元素就能毁掉整轮遍历。
 */
const SKIP_NAME = /退出登录|登出|logout|sign\s*out|注销账号|删除账号/i;

/** 允许出现在控制台/请求失败里的噪声：天气组件、favicon、可选静态资源 */
const NOISE = /weather|typhoon|location|favicon|\.map$|sourcemap/i;

/** 可点元素选择器。图标按钮很多是 div/svg 套壳，所以一并收 role/aria 标记的。 */
const CLICKABLE_SEL = [
  'button',
  '[role="button"]',
  '.el-button',
  '.re-button',
  '.rs-btn',
  'a[href]',
  '.el-dropdown-menu__item',
  '[class*="icon-btn"]',
  '[class*="iconBtn"]',
].join(',');

/** 收集可点元素并打上稳定标记，供后续逐个点击时重新定位 */
const COLLECT = `(() => {
  const sel = ${JSON.stringify(CLICKABLE_SEL)};
  // SVG 元素的 className 是 SVGAnimatedString，String() 出来全是同一个
  // "[object SVGAnimatedString]"，指纹会全部撞在一起 —— 统一取 class 属性。
  const clsOf = (el) => {
    const a = el.getAttribute && el.getAttribute('class');
    if (a != null) return String(a);
    const b = el.className;
    return typeof b === 'string' ? b : (b && b.baseVal) || '';
  };
  const nameOf = (el) => (el.getAttribute('aria-label') || el.getAttribute('title')
    || (el.textContent || '').trim() || '').replace(/\\s+/g, ' ').slice(0, 48);
  const disOf = (el) => el.disabled === true
    || el.getAttribute('aria-disabled') === 'true'
    || /is-disabled|is-disabled\\b/.test(String(el.className))
    || /disabled/.test(String(el.className));

  // 清理必须放在循环**外面**：写在循环体里的话，采集到第 N 个元素时
  // 会把前 N-1 个刚打好的标记全擦掉，最后只剩最后一个元素带 data-sweep-id，
  // 于是每个 locator.click 都停在「waiting for locator」上等到超时 ——
  // 症状看着像「页面按钮全都点不动」，其实是自己把标记擦了。
  for (const old of document.querySelectorAll('[data-sweep-id]')) old.removeAttribute('data-sweep-id');

  const baseSet = new Set(document.querySelectorAll(sel));
  const plan = [];
  for (const el of baseSet) plan.push({ el, kind: 'base' });

  /**
   * 第二遍：不是 <button>/<a> 但计算样式 cursor:pointer 的容器 —— 本仓大量
   * 可点元素是 <div @click>（侧栏导航 nav-item、技能卡片 mg-cell、分组标题、
   * 会话行……），它们既没有 role 也没有 href，任何基于标签的选择器都抓不到。
   * cursor 是**继承**属性，父容器 pointer 时所有子孙都会算成 pointer，
   * 所以只取「父级不是 pointer」的最外层，避免把整棵子树重复收进来。
   * 超过近半屏的容器视为布局容器而非控件，跳过。
   */
  const ptrSel = 'div,span,li,td,th,label,img,svg';
  for (const el of document.querySelectorAll(ptrSel)) {
    if (baseSet.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.cursor !== 'pointer') continue;
    const p = el.parentElement;
    if (p && getComputedStyle(p).cursor === 'pointer') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    if (r.width * r.height > innerWidth * innerHeight * 0.45) continue;
    plan.push({ el, kind: 'ptr' });
  }

  const out = [];
  const seenFp = new Map();
  let i = 0;
  for (const p of plan) {
    const el = p.el;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const visible = r.width >= 2 && r.height >= 2
      && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
    const disabled = disOf(el);
    const name = nameOf(el);
    const id = 'sw' + (i++);
    el.setAttribute('data-sweep-id', id);
    // 同指纹（tag+class+名字）元素里的序号：同名同类按钮可能有好几个
    // （页面上两处「添加模型」），重新定位时要能挑回同一个
    const cls = clsOf(el).slice(0, 80);
    const fp = el.tagName.toLowerCase() + '|' + cls + '|' + name;
    const ord = seenFp.get(fp) || 0;
    seenFp.set(fp, ord + 1);
    // 命中测试：元素中心点最上面的元素是不是它自己 —— 被遮挡时 click 会报
    // "intercepts pointer events"，那种「点不动」必须当成结果记下来而不是重试到超时。
    const top = r.width && r.height ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
    out.push({
      id, name, visible, disabled, ord, cls,
      tag: el.tagName.toLowerCase(),
      w: Math.round(r.width), h: Math.round(r.height),
      // 侧栏 / 标题栏这类常驻框架元素在每个路由下都是同一批，
      // 24 个路由重复点几百次纯属浪费（点一次就知道通不通），
      // 用 inChrome 标出来，由外层保证只扫一次。
      inChrome: !!el.closest('nav, aside, header, [class*="sidebar"], [class*="titlebar"]'),
      occluded: !!(top && top !== el && !el.contains(top) && !top.contains(el)),
      extra: p.kind === 'ptr',
    });
  }
  return out;
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 弹窗/抽屉的通用识别。
 *
 * 不能只认 `.el-overlay` / `.el-dialog`：本应用的「编辑供应商」这类弹窗是自定义
 * overlay，既不带 el-dialog 也不带 el-overlay（实测点开后两者计数都是 0，
 * 一度把正常按钮误判成「点了没反应」）。所以按「够大的、盖在上面的」来兜底。
 */
const COUNT_OVERLAYS = `(() => {
  let n = 0;
  for (const el of document.querySelectorAll(
    '[role="dialog"],.el-overlay,.el-drawer,.el-drawer__mask,'
    + '[class*="dialog"],[class*="modal"],[class*="drawer"],[class*="mask"],[class*="overlay"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 200) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    n++;
  }
  return n;
})()`;

/** 装一个 DOM 变更计数器：判断「点了有没有反应」最可靠的信号 */
const START_MUT = `(() => {
  if (window.__sweepMut) window.__sweepMut.stop();
  window.__sweepMut = { n: 0, stop() { this.obs.disconnect(); } };
  window.__sweepMut.obs = new MutationObserver((muts) => { window.__sweepMut.n += muts.length; });
  window.__sweepMut.obs.observe(document.body, {
    childList: true, subtree: true, attributes: true, characterData: true,
  });
  return true;
})()`;
const READ_MUT = `(() => {
  const m = window.__sweepMut;
  if (!m) return 0;
  const n = m.n;
  m.stop();
  return n;
})()`;

let RAW_TOKEN = '';

/**
 * 复位被持久化的侧栏状态。
 *
 * 本应用把两处布局状态写进 localStorage，点一次就**跨页面加载保留**，于是
 * 「重新导航」恢复不到默认视图：侧栏收起（sidebarVisible=false）后整个左侧栏
 * 被平移出视口，分组折叠（sessionGroupExpanded）后组内会话项根本不渲染——
 * 两者都会让后面的元素被误判成「点不到 / 已消失」，看着像一片坏按钮。
 */
async function resetPersistedUiState(p) {
  try {
    await p.evaluate(() => {
      localStorage.setItem('sidebarVisible', 'true');
      localStorage.removeItem('sessionGroupExpanded');
    });
  } catch { /* 页面还没起来就忽略，随后的导航会重试 */ }
}

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
    await sleep(1800);
    await p.locator('input[type="text"]').first().fill(process.env.USER_NAME || 'admin');
    await p.locator('input[type="password"]').first().fill(process.env.USER_PASS || 'admin123');
    await p.locator('button:has-text("登")').first().click();
    try { await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch { /* 继续以令牌是否取到为准 */ }
    await sleep(1500);
    p.off('response', onResp);
    if (RAW_TOKEN) return true;
  }
  return false;
}

/** 详情页要真实 id，用登录态从接口发现，不写死环境数据 */
async function discover(p) {
  // 登录后页面可能还在跳转（waitForURL 之后仍有一次 replace），evaluate 会撞上
  // "Execution context was destroyed" —— 重试几次，每次先等 URL 稳定。
  let lastUrl = '';
  for (let i = 0; i < 5; i++) {
    try {
      await p.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
      await sleep(1500);
      lastUrl = p.url();
      return await p.evaluate(async (token) => {
        const H = token ? { Authorization: 'Bearer ' + token } : {};
        const get = async (u) => { try { return await (await fetch(u, { headers: H })).json(); } catch { return null; } };
        const kb = await get('/api/knowledge/bases');
        const rows = kb?.data || [];
        const kbId = rows.length ? (rows[0].knowledge_base_id || rows[0].id || '') : '';
        const conn = await get('/v2/connectors/bound');
        const cr = conn?.data?.list || conn?.data?.records || conn?.data || [];
        const connId = Array.isArray(cr) && cr.length ? (cr[0].connector_id || cr[0].id || '') : '';
        return { kbId: String(kbId), connId: String(connId) };
      }, RAW_TOKEN);
    } catch (e) {
      console.log(`  discover retry ${i + 1}: ${String(e.message).split('\n')[0].slice(0, 120)}  url=${lastUrl.replace(BASE, '')}`);
      await sleep(2000);
    }
  }
  console.log('  discover failed after retries, continuing with empty ids');
  return { kbId: '', connId: '' };
}

/**
 * 关掉可能弹出的窗口，并等遮罩真的消失。
 * 等待必须收在 helper 里：遮罩关闭有淡出动画，返回后还会短暂存在，
 * 下一次点击会被它 intercept —— 报出来却像「按钮点不动」，与真因无关。
 */
async function closeOverlays(p) {
  const count = () => p.evaluate(COUNT_OVERLAYS).catch(() => 0);
  for (let round = 0; round < 3; round++) {
    if ((await count()) === 0) return true;
    const cancel = p.locator(
      '[role="dialog"] button:has-text("取消"),'
      + '.el-message-box:visible button:has-text("取消"),'
      + '.el-overlay:visible button:has-text("取消"),'
      + '.el-overlay:visible button:has-text("关闭"),'
      + '[role="dialog"] button:has-text("关闭")',
    ).first();
    if (await cancel.count() > 0) await cancel.click({ timeout: 4000 }).catch(() => {});
    else {
      // 自定义 overlay 未必响应 Escape：先按 Escape，还留着就点右上角的关闭叉
      await p.keyboard.press('Escape').catch(() => {});
      await sleep(500);
      if ((await count()) > 0) {
        const x = p.locator(
          '.el-dialog__headerbtn,'
          + '[role="dialog"] [aria-label="close"],'
          + '[class*="dialog"] [class*="close"]',
        ).first();
        if (await x.count() > 0) await x.click({ timeout: 3000, force: true }).catch(() => {});
      }
    }
    for (let i = 0; i < 12; i++) {
      if ((await count()) === 0) return true;
      await sleep(300);
    }
  }
  return (await count()) === 0;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();

  /** 每个路由独立收集，点某个元素时产生的错误只算到那个元素头上 */
  let bucket = { pageErrors: [], consoleErrors: [], failed: [] };
  const netLog = [];
  page.on('pageerror', (e) => bucket.pageErrors.push(String(e.message).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') bucket.consoleErrors.push(m.text().slice(0, 200)); });
  page.on('response', (r) => {
    if (r.status() >= 400) netLog.push({ status: r.status(), url: r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 120) });
  });
  page.on('requestfailed', (r) => {
    const u = r.url().replace(BASE, '').replace(/^https?:\/\/[^/]+/, '');
    /**
     * 主动取消不算失败：切会话/换路由会掐断在飞请求与 SSE 流，Playwright 把它
     * 也记成 requestfailed（net::ERR_ABORTED）。照单全收会得出「点了就报错」的
     * 假 FAIL——真正的服务端错误仍由 4xx/5xx 响应那条线（netLog/err4xx）兜住。
     */
    const reason = (r.failure() && r.failure().errorText) || '';
    if (/ERR_ABORTED/i.test(reason)) return;
    if (!NOISE.test(u)) bucket.failed.push(r.method() + ' ' + u.slice(0, 120));
  });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));

  const report = { base: BASE, startedAt: new Date().toISOString(), routes: [] };
  let pass = 0, fail = 0, warn = 0;
  /**
   * 框架常驻元素（侧栏导航、标题栏）只扫一次。
   * 用 name+class 当键：同一个「刷新」按钮在不同页面里是不同元素、必须各测一次，
   * 而侧栏导航项跨页是同一批、测一次即可 —— 所以只在 inChrome 时才去重。
   */
  const chromeSeen = new Set();
  let chromeDone = false;

  if (!(await login(page))) {
    console.log('LOGIN FAIL');
    await browser.close();
    process.exit(3);
  }
  const d = await discover(page);
  console.log(`LOGIN OK  kbId=${d.kbId || '(无)'}  connId=${d.connId || '(无)'}`);
  report.discovered = d;

  const targets = ROUTES.filter((r) => !ONLY.length || ONLY.some((o) => r.path.includes(o) || r.name.includes(o)));

  for (const route of targets) {
    const url = route.path.replace('__ID__', d.kbId).replace('__CONN__', d.connId || 'missing');
    const R = {
      route: route.path, name: route.name, url,
      total: 0, elements: [], pageErrors: [], consoleErrors: [], failed: [],
      net5xx: [], notes: [],
    };
    bucket = { pageErrors: [], consoleErrors: [], failed: [] };
    netLog.length = 0;

    let gotoOk = true;
    try {
      await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
      // 定向后 URL 可能又被 replace（如 /bots -> /bots/management）：跟随它，
      // 否则 settle 睡在半路上、COLLECT 撞上导航直接抛错。
      await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
      await sleep(1500);
      // 再给异步内容一次机会：等 body 里出现可点元素或 settle 耗尽。
      // 注意用「可见尺寸」的计数：/agents、/skills 这类页首屏只有框架按钮
      // （17 个里 0 可见），主体要滚到底才挂载 —— 裸 button 计数 >0 会提前通过。
      const deadline = Date.now() + route.settle;
      for (;;) {
        let n = 0;
        try {
          n = await page.evaluate(() => [...document.querySelectorAll('button,[role="button"]')]
            .filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2; }).length);
        } catch { break; }
        if (n > 0 || Date.now() > deadline) break;
        await sleep(1000);
      }
      // 滚一遍触发懒加载：有些页面的主体内容只在滚动到视口时才挂载，
      // 不滚的话 COLLECT 只能采到框架按钮，漏掉整页主体。
      try {
        for (let i = 0; i < 6; i++) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await sleep(600);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(800);
      } catch { /* 滚动失败不影响采集 */ }
    } catch (e) {
      gotoOk = false;
      R.notes.push('打开页面失败: ' + String(e.message).slice(0, 120));
    }

    if (gotoOk) {
      // 路由自身是否健康：先记基线，页面加载阶段就已经炸的错算路由的锅
      const loadErrs = [...bucket.pageErrors];
      // 「Failed to load resource: … 404」这条控制台消息**不带 URL**，
      // 无法判断是哪个请求；而带 URL 的 4xx/5xx 已由 netLog 精确记录。
      // 所以这里把它剔掉，否则每个路由都会挂一条查不出来源的假错
      // （实测这条来自顶栏天气组件访问不到外网，属可接受的静默降级）。
      const loadCerr = bucket.consoleErrors.filter(
        (t) => !NOISE.test(t) && !/Failed to load resource/i.test(t),
      );
      const loadFailed = [...bucket.failed];
      // 天气组件 503 属外网不可达的静默降级（NOISE），不能算路由的加载期错误
      const load5xx = netLog.filter((n) => n.status >= 500 && !NOISE.test(n.url));

      let items = [];
      try {
        items = await page.evaluate(COLLECT);
      } catch (e) {
        R.notes.push('收集可点元素失败: ' + String(e.message).slice(0, 120));
      }
      R.total = items.length;

      const nameless = items.filter((i) => i.visible && !i.name);
      const collapsed = items.filter((i) => i.visible && (i.w < 8 || i.h < 8));

      // COLLECT_ONLY=1：只量采集规模（新选择器在各路由收多少、多少可见），不点
      if (process.env.COLLECT_ONLY) {
        const vis = items.filter((i) => i.visible);
        const ex = items.filter((i) => i.extra);
        console.log(`  [${R.name}] total=${items.length} visible=${vis.length}`
          + ` extra=${ex.length} extraVisible=${ex.filter((i) => i.visible).length}`
          + ` noName=${vis.filter((i) => !i.name).length}`
          + ` notes=${JSON.stringify(R.notes)}`);
        report.routes.push(R);
        fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
        continue;
      }

      for (const it of items) {
        const label = it.name || '(无名)' + ' [' + it.cls.slice(0, 30) + ']';
        const rec = { name: label, cls: it.cls, tag: it.tag, extra: !!it.extra, state: 'ok', effect: '', err: '' };

        if (!it.visible) { rec.state = 'hidden'; R.elements.push(rec); continue; }
        if (!it.name) { rec.state = 'no-accessible-name'; R.elements.push(rec); warn++; continue; }
        if (SKIP_NAME.test(it.name)) { rec.state = 'skipped'; R.elements.push(rec); continue; }
        if (it.disabled) { rec.state = 'disabled'; R.elements.push(rec); continue; }
        if (it.inChrome) {
          const k = it.tag + '|' + it.cls + '|' + it.name;
          if (chromeSeen.has(k)) { rec.state = 'dup-chrome'; R.elements.push(rec); continue; }
          chromeSeen.add(k);
          if (chromeDone) { rec.state = 'dup-chrome'; R.elements.push(rec); continue; }
        }

        // 点之前把桶清空：这个元素产生的错只算它自己的
        bucket = { pageErrors: [], consoleErrors: [], failed: [] };
        netLog.length = 0;
        const beforeOverlays = await page.evaluate(COUNT_OVERLAYS).catch(() => 0);
        await page.evaluate(START_MUT).catch(() => {});

        /**
         * 点击前**重新采集**并按指纹重新定位。
         *
         * 不能直接用采集时打的 data-sweep-id：点第一个按钮就会触发 Vue 重渲染，
         * 列表里所有节点被替换，后面每个 id 都不在 DOM 里了 ——
         * 表现为一串「点不动」，看着像页面有毛病，其实是自己把自己点没了。
         */
        const fp = it.tag + '|' + it.cls + '|' + it.name;
        const findByFingerprint = async () => {
          const fresh = await page.evaluate(COLLECT);
          const same = fresh.filter((x) => x.tag + '|' + x.cls + '|' + x.name === fp);
          // 用采集时的序号挑同一个：同名同类的按钮可能不止一个（如两处「添加模型」）
          return same.length ? same[Math.min(it.ord, same.length - 1)] : null;
        };
        let target = null;
        let freshCount = -1;
        try {
          const fresh = await page.evaluate(COLLECT);
          freshCount = fresh.length;
          const same = fresh.filter((x) => x.tag + '|' + x.cls + '|' + x.name === fp);
          if (same.length) {
            target = same[Math.min(it.ord, same.length - 1)];
          }
        } catch { /* 重新采集失败就按消失处理 */ }
        /**
         * 目标不在当前视图里（点完上一个按钮进了详情/弹窗，列表整个换掉）时，
         * **重新导航回本路由再找一次**。
         *
         * 不这么做的话，Plugins / KnowledgeBaseDetail / Connectors 这些页面上
         * 第一个点击就把视图切走的元素，之后几十个元素会全部记成
         * 「点不动」—— 看起来像几十个坏按钮，其实一个都没点到。
         */
        let renavigated = false;
        if (!target) {
          try {
            await resetPersistedUiState(page);
            await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
            await sleep(Math.min(route.settle, 6000));
            target = await findByFingerprint();
            renavigated = !!target;
          } catch { /* 重新导航后仍找不到就记为消失 */ }
        }
        rec.fresh = freshCount;
        rec.renavigated = renavigated;
        const urlBefore = page.url();

        let clicked = true, clickErr = '', forced = false;
        if (!target) {
          clicked = false;
          clickErr = '重新导航回本路由后仍未出现（该元素只存在于某个瞬态视图里）';
        } else {
          const sel = '[data-sweep-id="' + target.id + '"]';
          let recovered = false;
          try {
            await page.locator(sel).first().click({ timeout: 5000, noWaitAfter: true });
          } catch (e1) {
            /**
             * 「Element is outside of the viewport」= 布局被**本路由先前的点击**改掉了。
             *
             * 典型病例：Chat 路由先点到「收起侧边栏」（正常功能，必须测），
             * 左侧栏被平移出视口后，DOM 里后续几十个 .nav-item / .session-item
             * 仍带非零尺寸（采集阶段因此判为可见），但普通点击与 force 都够不着，
             * 会被整批记成 FAIL —— 看着像侧栏按钮全坏，其实一个都没点到。
             *
             * 收起状态持久在 localStorage（useStorage('sidebarVisible')），所以光
             * 重新导航没用：先把该键复位成展开，再回本路由重新找目标点一次。
             */
            if (/outside of the viewport/i.test(String(e1.message))) {
              try {
                await resetPersistedUiState(page);
                await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
                await sleep(Math.min(route.settle, 6000));
                const again = await findByFingerprint();
                if (!again) throw new Error('重新展开侧栏后目标仍不在本路由');
                target = again;
                rec.renavigated = renavigated = true;
                await page.locator('[data-sweep-id="' + again.id + '"]').first().click({ timeout: 5000, noWaitAfter: true });
                recovered = true;
              } catch (e1r) {
                e1 = e1r;
              }
            }
            if (!recovered) {
            /**
             * 正常点不动时再用 force 兜一次，**必须分两级**。
             *
             * 本应用侧栏有个常驻悬浮按钮（.floating-chat-btn，title=收起/隐藏）
             * 带持续动画，Playwright 的「等待元素稳定」永远不满足，
             * 每次都重试到超时。若把它一律记成 FAIL，就会得出
             * 「页面按钮点不动」的假结论；force 能点通说明处理器是好的，
             * 只是这个元素对自动化不友好 —— 归 WARN，不归 FAIL。
             */
            try {
              await page.locator(sel).first().click({ timeout: 5000, force: true, noWaitAfter: true });
              forced = true;
            } catch (e2) {
              clicked = false;
              /**
               * Playwright 把真正的原因埋在 call log 里（"element is not stable" /
               * "… intercepts pointer events" / "element was detached"），
               * 只取头两行的话所有失败都长成「Timeout … exceeded」一个样，等于没诊断。
               * 这里按关键词把有效行捞出来。
               */
              const raw = String(e2.message).split('\n').map((x) => x.trim()).filter(Boolean);
              const why = raw.filter((x) => /not stable|intercepts|outside of the viewport|not visible|not enabled|is disabled|detached|resolved to|strict mode violation/i.test(x));
              clickErr = (why.length ? why : raw.slice(0, 2)).slice(0, 3).join(' / ').slice(0, 260);
              if (process.env.SWEEP_DEBUG) {
                fs.appendFileSync(
                  path.join(OUT, 'click-errors.txt'),
                  '\\n### ' + R.name + ' | ' + label + ' | target=' + (target ? target.id + ' ' + target.tag + '.' + target.cls : 'null')
                  + '\\n--- 第一次(普通) ---\\n' + String(e1.message)
                  + '\\n--- 第二次(force) ---\\n' + String(e2.message) + '\\n',
                );
              }
            }
            }
          }
        }
        await sleep(1100);

        const toasts = await page.locator('.el-message, .re-toast, .el-notification').allInnerTexts().catch(() => []);
        const overlays = await page.evaluate(COUNT_OVERLAYS).catch(() => 0);
        // DOM 变更条数：判断「点了有没有反应」最硬的信号。
        // 之前用 innerHTML.length 前后比较，开弹窗后长度恰好相等就被判成
        // 「点了没反应」，把好按钮误报成死按钮。
        const muts = await page.evaluate(READ_MUT).catch(() => 0);
        const errs = [
          ...bucket.pageErrors,
          // "Failed to load resource: … 404" 是下面 net4xx 事件的重复表述，
          // 留在 err 里会让每个按钮都挂一条一模一样的假错，把真错淹掉
          ...bucket.consoleErrors.filter((t) => !NOISE.test(t) && !/Failed to load resource/i.test(t)),
        ];
        const err5xx = netLog.filter((n) => n.status >= 500 && !NOISE.test(n.url));
        const err4xx = netLog.filter((n) => n.status >= 400 && n.status < 500 && !NOISE.test(n.url));
        const failedReq = [...bucket.failed];

        rec.effect = '接口' + netLog.length + '次 toast' + toasts.length + ' 弹窗' + overlays
          + ' DOM变更' + muts + '条';
        rec.urlChanged = page.url() !== urlBefore;
        if (rec.urlChanged) rec.afterUrl = page.url().replace(BASE, '');
        if (errs.length) rec.err = errs.join(' | ').slice(0, 200);
        if (err5xx.length) rec.err = (rec.err ? rec.err + ' | ' : '') + '5xx:' + err5xx.map((x) => x.status + ' ' + x.url).join(',').slice(0, 160);
        if (err4xx.length) rec.err4xx = err4xx.map((x) => x.status + ' ' + x.url).join(',').slice(0, 200);
        if (failedReq.length) rec.err = (rec.err ? rec.err + ' | ' : '') + '请求失败:' + failedReq.join(',').slice(0, 160);

        if (!clicked) {
          /**
           * 区分两种「点不动」：
           * - 元素还在，只是不可见（Element is not visible）：说明**状态变了**。
           *   例如知识库问答面板的快捷提问按钮带 v-if="!hasTurns"，一提问就消失；
           *   采集时可见、点击时不可见属于正常的状态相关 UI，不是坏按钮。
           *   真正坏掉的按钮会「一直」不可见，采集阶段就已经被 hidden 过滤掉了。
           * - 元素确实点不到（被遮挡等）：仍算 FAIL。
           */
          const invisible = /not visible/i.test(clickErr);
          rec.state = target ? (invisible ? 'state-dependent' : 'not-clickable') : 'vanished';
          rec.err = rec.err || clickErr;
        } else if (rec.err) {
          rec.state = 'click-error';
        } else if (netLog.length === 0 && toasts.length === 0 && overlays <= beforeOverlays && muts === 0) {
          rec.state = 'no-effect';
        } else if (forced) {
          rec.state = 'needs-force';
        }

        if (rec.state === 'click-error' || rec.state === 'not-clickable') fail++;
        else if (rec.state === 'no-effect' || rec.state === 'needs-force'
          || rec.state === 'vanished' || rec.state === 'state-dependent') warn++;
        else pass++;

        // 收尾：关掉弹窗/抽屉，否则会一直挡着后面的元素
        if (overlays > 0) await closeOverlays(page);
        if (await page.evaluate(COUNT_OVERLAYS).catch(() => 0) > 0) {
          await page.keyboard.press('Escape').catch(() => {});
          await sleep(500);
        }
        R.elements.push(rec);
      }

      if (nameless.length) R.notes.push('无名可点元素 ' + nameless.length + ' 个: ' + nameless.map((i) => i.cls.slice(0, 24)).join(' | ').slice(0, 220));
      // 第一页扫完后，框架常驻元素就都测过了，后续路由只测页面自己的元素
      chromeDone = true;
      if (collapsed.length) R.notes.push('尺寸塌陷 ' + collapsed.length + ' 个: ' + collapsed.map((i) => (i.name || i.cls.slice(0, 18)) + '(' + i.w + 'x' + i.h + ')').join(', ').slice(0, 200));
      R.pageErrors = loadErrs;
      R.consoleErrors = loadCerr;
      R.failed = loadFailed;
      R.net5xx = load5xx;
      R.net4xx = netLog.filter((n) => n.status >= 400 && n.status < 500 && !NOISE.test(n.url));
    }

    // 每个路由落一次盘：整轮十几分钟，中途超时也不能丢掉已跑的结果
    report.routes.push(R);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    const bad = R.elements.filter((e) => e.state === 'click-error' || e.state === 'not-clickable');
    const noeff = R.elements.filter((e) => e.state === 'no-effect');
    console.log(
      `  [${R.name}] 可点 ${R.total} 个  异常 ${bad.length}  无副作用 ${noeff.length}`
      + (bad.length ? '  -> ' + bad.slice(0, 4).map((e) => e.name + '(' + e.state + ')').join(', ') : '')
      + (R.pageErrors.length ? '  加载期pageerror:' + R.pageErrors.length : '')
      + (R.notes.length ? '  备注:' + R.notes.length : ''),
    );
  }

  // 汇总
  const all = report.routes.flatMap((r) => r.elements.map((e) => ({ ...e, route: r.name })));
  const byState = {};
  for (const e of all) byState[e.state] = (byState[e.state] || 0) + 1;
  report.summary = {
    total: all.length, byState,
    pass, fail, warn,
    clickError: all.filter((e) => e.state === 'click-error'),
    notClickable: all.filter((e) => e.state === 'not-clickable'),
    noEffect: all.filter((e) => e.state === 'no-effect'),
    needsForce: all.filter((e) => e.state === 'needs-force'),
    vanished: all.filter((e) => e.state === 'vanished'),
    stateDependent: all.filter((e) => e.state === 'state-dependent'),
    noAccessibleName: all.filter((e) => e.state === 'no-accessible-name'),
    routeLoadErrors: report.routes.filter((r) => r.pageErrors.length || r.consoleErrors.length || r.net5xx.length),
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log('\n===== 遍历汇总 =====');
  console.log('  可点元素总数=' + all.length + '  ' + JSON.stringify(byState));
  console.log('  PASS=' + pass + ' FAIL=' + fail + ' WARN=' + warn);
  console.log('\n----- FAIL 明细 -----');
  for (const e of [...report.summary.clickError, ...report.summary.notClickable]) {
    console.log('  [' + e.route + '] ' + e.name + '  ' + e.state + '  ' + (e.err || '').slice(0, 180));
  }
  console.log('\n----- 路由加载期错误 -----');
  for (const r of report.summary.routeLoadErrors) {
    console.log('  [' + r.name + '] pageerror=' + JSON.stringify(r.pageErrors).slice(0, 200)
      + ' console=' + JSON.stringify(r.consoleErrors).slice(0, 200)
      + ' 5xx=' + JSON.stringify(r.net5xx).slice(0, 200)
      + ' failed=' + JSON.stringify(r.failed).slice(0, 160));
  }
  console.log('\n----- WARN：点了没有任何可观测副作用（需人工判是否死按钮）-----');
  for (const e of report.summary.noEffect) console.log('  [' + e.route + '] ' + e.name + '  ' + e.cls.slice(0, 60));
  console.log('\n----- WARN：需 force 才能点（持续动画/遮挡，处理器本身可用）-----');
  for (const e of report.summary.needsForce) console.log('  [' + e.route + '] ' + e.name + '  ' + e.cls.slice(0, 60));
  console.log('\n----- WARN：重导航后仍不存在（按钮只在别的视图/弹窗里出现）-----');
  for (const e of report.summary.vanished) console.log('  [' + e.route + '] ' + e.name + '  ' + e.cls.slice(0, 60));
  console.log('\n----- WARN：状态相关（点击前自行隐藏/禁用，属正常 UI 行为）-----');
  for (const e of report.summary.stateDependent) console.log('  [' + e.route + '] ' + e.name + '  ' + e.cls.slice(0, 60));
  console.log('\n----- 无可访问名的可点元素 -----');
  for (const e of report.summary.noAccessibleName) console.log('  [' + e.route + '] ' + e.cls.slice(0, 70));

  await browser.close();
  process.exit(fail === 0 ? 0 : 3);
})().catch((e) => {
  console.error('FATAL: ' + e.message + '\n' + (e.stack || '').slice(0, 400));
  process.exit(3);
});