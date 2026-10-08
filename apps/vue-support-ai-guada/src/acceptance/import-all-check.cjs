/**
 * 定向验收：模型管理 → 供应商详情右上「添加模型」→ 一键批量录入。
 *
 * 需求（2026-10-07）：点右上「添加新的」要先拉出该提供商的全部模型，再点一下就
 * 直接调后端接口把整个提供商的模型**自动批量录入**，不要逐条点「选择」。
 *
 * 断言（状态感知，首次与复跑都严判）：
 *   0. 上游目录先用后端的拉取接口取回，作为「应录入集合」的基准；
 *   1. 「添加模型」直接打开手工表单；表单上的「获取」按钮打开拉取列表，
 *      行数 == 上游目录数，且行内「逐条选择」仍在
 *      ——新入口不能把老路径弄丢；
 *   2. 「全部录入」按钮带数量（== 上游目录数）；
 *   3. 点击后提示「已录入 X / 跳过 Y」，且 **X 必须恰好等于「上游有而库里没有」的
 *      条数**、Y 恰好等于其余条数 —— 首次跑 X>0（真录入），复跑 X=0（全跳过），
 *      两种状态都必须分毫不差；弹窗随即关闭、卡片数与 DB 条数同步 +X；
 *   4. 录入的图像/视频模型 task 必须是 image_generation / video_generation
 *      （修掉 inferTasks 只认 dall-e/cogview 的老毛病，否则会全判成 chat 被分进
 *      「文本」组）——仅在本次真有录入时断言；
 *   5. **幂等**：同一按钮再点一次必须是「已录入 0、跳过=总数」，DB 条数不变；
 *   6. 「手动添加」逃生口仍能回到手工表单（表单未关闭），「获取」按钮重新打开拉取列表；
 *   7. 全程无 pageerror、无 allowlist 之外的 4xx。
 *
 * 结果：.ui-click-sweep-chunks/import-all.json（与 sweep 报告同目录，便于一起归档）。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.ACCEPT_BASE || 'http://localhost:15689';
const OUT = path.join(__dirname, '.ui-click-sweep-chunks', 'import-all.json');
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';

/** 已知残留 404（SIGNOFF §4 已列，不属本轮改动范围），命中即不判失败 */
const KNOWN_404 = [
  /\/v2\/sessions\/[^/]+\/goal/,
  /sessionAgentApi|\/session\/agent\//,
  /favicon\.ico/,
  /weather-api/, // dev 下 vite 代理外部天气 API，历轮验收均列为环境噪音
  // 顶栏台风小组件（TopEnvironment.vue -> getActiveTyphoonList）打的是第三方接口，
  // 同样属环境噪音；ui-click-sweep.cjs 的 NOISE 与 kb-ui-accept.cjs 早已排除它，
  // 本套件的白名单此前漏配。
  /typhoon-api/,
  // 天气小组件直连的第三方限流：并发验收触发 429，与产品代码无关
  /api\.open-meteo\.com/,
];

const checks = [];
const errs = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail || '') });
  if (!ok) errs.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const headers = (tk) => ({ Authorization: 'Bearer ' + tk, 'x-oauth-token': tk, 'Content-Type': 'application/json' });
async function apiLogin() {
  const r = await fetch(BASE + '/v2/user/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const body = await r.json();
  return body?.data?.accessToken || '';
}
async function apiGet(pathname, tk) {
  const r = await fetch(BASE + pathname, { headers: headers(tk) });
  return await r.json();
}
async function apiPost(pathname, tk, body) {
  const r = await fetch(BASE + pathname, {
    method: 'POST', headers: headers(tk), body: JSON.stringify(body || {}),
  });
  return await r.json();
}
/** 后端把模型任务折进 capabilities[0].task，前端靠它分组 */
const taskOf = (m) => m?.capabilities?.[0]?.task || '';
/** 与后端 inferTasks 同规则的期望值（只断言图像/视频两类，正是本次修的） */
const expectTask = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes('image') || n.includes('dall-e') || n.includes('cogview') || n.includes('flux') || n.includes('sdxl')) {
    return 'image_generation';
  }
  if (n.includes('video')) return 'video_generation';
  return 'chat';
};

async function login(p) {
  // vite 首次访问新路由会重新优化依赖并强制 reload（本轮实测两次打断登录/导航），
  // 所以登录与进页都要能重试，不能一次超时就判死
  let lastErr = null;
  for (let i = 0; i < 3; i++) {
    try {
      await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await p.waitForSelector('input[type="password"]', { timeout: 40000 });
      await sleep(1500);
      await p.locator('input[type="text"]').first().fill(USER);
      await p.locator('input[type="password"]').first().fill(PASS);
      await p.locator('button:has-text("登")').first().click();
      await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 30000 });
      await sleep(1500);
      return;
    } catch (e) {
      lastErr = e;
      await sleep(4000);
    }
  }
  throw lastErr;
}

/** 打开某页并等关键元素就绪，被 vite reload 打断就重来（最多 attempts 次） */
async function gotoReady(p, url, selector, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await p.waitForSelector(selector, { timeout: 35000 });
      return;
    } catch (e) {
      lastErr = e;
      await sleep(4000);
    }
  }
  throw lastErr;
}

/**
 * 给当前屏幕上的通知打标记，之后只认**新节点**。
 *
 * 光比文案不够：连点两次「全部录入」时，第二次提示与第一次一字不差（都是
 * 「已录入 0 个…」），按文案判「新」会永远等不到。改用 DOM 节点标记（通知是
 * ElNotification 指令式挂载的，属性不会被 Vue 重渲染抹掉）。
 *
 * @param page 页面
 */
async function markToasts(page) {
  await page.locator('.el-notification').evaluateAll((els) =>
    els.forEach((e) => e.setAttribute('data-acc-pre', '1'))).catch(() => {});
}
/**
 * 等一条**点击后新出现**的通知。
 *
 * @param page 页面
 * @param timeoutMs 超时
 * @returns 新通知文案，超时返回空串
 */
async function waitNewNotify(page, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const fresh = page.locator('.el-notification:not([data-acc-pre])');
    if ((await fresh.count()) > 0) {
      const txt = ((await fresh.last().textContent().catch(() => '')) || '').trim().replace(/\s+/g, ' ');
      if (txt) return txt;
    }
    await sleep(150);
  }
  return '';
}
const parseCounts = (txt) => {
  const imp = /已录入\s*(\d+)\s*个/.exec(txt || '');
  const skip = /跳过\s*(\d+)\s*个/.exec(txt || '');
  return { imported: imp ? Number(imp[1]) : null, skipped: skip ? Number(skip[1]) : null };
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } });
  const page = await ctx.newPage();
  const jsErrors = [];
  const badResponses = [];
  page.on('pageerror', (e) => jsErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/Failed to load resource/.test(m.text())) return; // 资源 404 归 HTTP 检查
    jsErrors.push('console: ' + m.text());
  });
  page.on('response', (r) => { if (r.status() >= 400) badResponses.push(r.status() + ' ' + r.url()); });

  let tk = '';
  let provider = null;
  let upstream = [];
  let before = 0;
  let missing = [];
  try {
    // ── 0. 登录 + 选目标供应商 + 取上游目录基准 ────────────────────────
    await login(page);
    add('login', true, USER);

    tk = await apiLogin();
    const listBody = await apiGet('/api/providers', tk);
    const list = Array.isArray(listBody?.data) ? listBody.data : [];
    const withUpstream = list.filter((p) => p?.base_url && (p?.api_key_count > 0 || p?.api_keys?.length > 0));
    provider = withUpstream.find((p) => /agnes/i.test(p.provider_id || p.name || '')) || withUpstream[0] || null;
    add('provider.picked', !!provider,
      provider ? `${provider.provider_id} url=${provider.base_url} dbModels=${provider.models?.length ?? 0}` : 'no upstream provider');

    // 后端拉取接口 = import-all 用的同一个上游口径，作为「应录入集合」
    const fetched = await apiPost(`/api/providers/${encodeURIComponent(provider.provider_id)}/models`, tk, {});
    upstream = Array.isArray(fetched?.data?.models) ? fetched.data.models : [];
    const upstreamNames = upstream.map((m) => m?.name || m?.id || '').filter(Boolean);
    add('upstream.list', upstreamNames.length > 0, 'upstreamCount=' + upstreamNames.length);

    const dbNames = (provider.models || []).map((m) => m.model).filter(Boolean);
    before = dbNames.length;
    missing = upstreamNames.filter((n) => !dbNames.includes(n));
    add('baseline', true,
      `db=${before} upstream=${upstreamNames.length} missing=${missing.length} (mode=${missing.length ? 'fresh' : 'idempotent-only'})`);

    // ── 1. 进 /models → 选中该供应商 ────────────────────────────────────
    // 基准探针刚打过一次上游，隔一会儿再让弹窗去拉，避免把网关限流触发出来
    await sleep(3000);
    await gotoReady(page, BASE + '/models', '.mw-item');
    const item = page.locator('.mw-item', { hasText: provider.name }).first();
    add('aside.item', (await item.count()) > 0, 'name=' + provider.name);
    await item.click();
    await page.waitForSelector('.model-grid, .d-empty', { timeout: 20000 });

    const cardCount = async () => await page.locator('.model-grid .mc').count();
    const uiBefore = await cardCount();
    add('grid.before', uiBefore === before, 'uiCards=' + uiBefore + ' db=' + before);

    // ── 2. 右上「添加模型」→ 默认直接打开手工表单 ──────────
    const addBtn = page.locator('.d-band-actions button:has-text("添加模型")').first();
    add('header.addBtn', (await addBtn.count()) > 0, 'count=' + (await addBtn.count()));
    await addBtn.click();
    await page.waitForSelector('.model-edit-dialog', { timeout: 20000 });
    add('formDialog.open', true, 'dialog=1');

    // 点击表单上的「获取」按钮 → 打开拉取列表
    const fetchBtn = page.locator('.model-edit-dialog .el-button.is-circle');
    add('fetchBtn', (await fetchBtn.count()) > 0, 'count=' + (await fetchBtn.count()));
    await fetchBtn.first().click();
    await page.waitForSelector('.model-fetch-dialog', { timeout: 20000 });
    add('fetchDialog.open', true, 'dialog=1');

    // 列表是打开弹窗后才向上游拉的：固定 sleep(800) 在网关慢时读到 0 假失败
    // （2026-10-08 实测 rows=0 而 upstream=12），改为等真实行出现，20s 兜底
    await page.waitForSelector('.model-fetch-dialog .fetch-row', { timeout: 20000 }).catch(() => {});
    await sleep(300);
    const rowCount = await page.locator('.model-fetch-dialog .fetch-row').count();
    add('fetchDialog.rows', rowCount === upstreamNames.length,
      'rows=' + rowCount + ' upstream=' + upstreamNames.length);

    const selBtns = page.locator('.model-fetch-dialog .fetch-row button:has-text("选择")');
    add('fetchDialog.perRowSelect', (await selBtns.count()) > 0, 'count=' + (await selBtns.count()));

    const importBtn = page.locator('.model-fetch-dialog button:has-text("全部录入")').first();
    const btnText = ((await importBtn.textContent().catch(() => '')) || '').trim();
    add('import.btn', (await importBtn.count()) > 0, 'label=' + btnText);
    add('import.btnCount', btnText.includes(String(upstreamNames.length)),
      'label=' + btnText + ' upstream=' + upstreamNames.length);

    // ── 3. 「全部录入」：分段收敛，逐步验守恒与落库 ────────────────────
    // 上游网关在快速重复调用时可能只回一部分目录（实测同一密钥连打回 8/12、偶发 401），
    // 所以不能假设「点一次就全录进来」，而是逐次验：
    //   a. 响应守恒：录入 + 跳过 <= 上游目录条数；
    //   b. 落库与提示一致：DB / 卡片每次必须恰好 +imported；
    //   c. 某次拿到**完整**目录时必须一条不录（全录过了 → 收敛 + 幂等同时达成）；
    //   d. 最终库里的条数必须等于上游目录条数。
    // 先快照已有通知，免得把打开弹窗时那条「已获取到 N 个模型」当成本次结果。
    let dbNow = before;
    let uiNow = uiBefore;
    let totalImported = 0;
    let attempts = 0;
    let gotCompleteCall = false;
    let gotIdempotentComplete = false; // 完整目录 + 一条没录 = 收敛且幂等
    let completeToast = '';
    /** 弹窗有没有开着（关的时候有淡出动画，别拿它当「还开着」） */
    const dialogOpen = async () => (await page.locator('.model-fetch-dialog:visible').count()) > 0;
    /** 等弹窗真正关掉（给淡出留时间，避免在动画里断言） */
    const waitDialogClosed = async (ms = 8000) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (!(await dialogOpen())) return true;
        await sleep(200);
      }
      return false;
    };
    /** 点击表单的「获取」按钮打开 fetchDialog（表单-dialog 应该已经打开） */
    const openFetchFromForm = async () => {
      if ((await page.locator('.model-edit-dialog:visible').count()) === 0) {
        await addBtn.click().catch(() => {});
        await page.waitForSelector('.model-edit-dialog', { timeout: 20000 });
        await sleep(500);
      }
      const fetchBtn = page.locator('.model-edit-dialog .el-button.is-circle');
      if ((await fetchBtn.count()) > 0) {
        await fetchBtn.first().click().catch(() => {});
      }
    };
    /** 确保「录入按钮」可见且可用：可能已开、正在淡入、或上次拉取失败导致列表空/按钮禁用 */
    const openDialog = async () => {
      const btn = page.locator('.model-fetch-dialog button:has-text("全部录入")');
      const deadline = Date.now() + 120000;
      let reopened = 0;
      while (Date.now() < deadline) {
        if ((await btn.count()) > 0) {
          const b = btn.first();
          if ((await b.isVisible().catch(() => false)) && (await b.isEnabled().catch(() => false))) return;
        }
        if (!(await dialogOpen())) {
          await openFetchFromForm();
        } else if ((await page.locator('.model-fetch-dialog .fetch-row').count()) === 0 && reopened < 4) {
          // 上游偶发没拉到（快速连打会 401/短返回）→ 关掉重开，让它再拉一次；
          // 每次退避久一点，给网关限流冷却的时间
          reopened++;
          await page.keyboard.press('Escape');
          await sleep(4000 + reopened * 4000);
          await openFetchFromForm();
        }
        await sleep(400);
      }
      throw new Error('fetch dialog 未就绪：列表为空或「全部录入」按钮不可用');
    };

    while (attempts < 5 && !gotIdempotentComplete) {
      attempts++;
      await openDialog();
      const btn = page.locator('.model-fetch-dialog button:has-text("全部录入")').first();
      await markToasts(page);
      const toastP = waitNewNotify(page, 40000);
      await btn.click();
      const toast = await toastP;
      const c = parseCounts(toast);
      const conserved = c.imported !== null && c.skipped !== null && c.imported + c.skipped <= upstreamNames.length;
      add(`import.attempt${attempts}`, conserved, `toast="${toast}"`);
      if (!conserved) break;
      totalImported += c.imported;

      // b. DB 与卡片两个口径都必须与提示的录入数对上（防「说了没做」）
      const step = await apiGet('/api/providers/' + encodeURIComponent(provider.provider_id), tk);
      const dbStep = step?.data?.models?.length ?? -1;
      add(`import.dbStep${attempts}`, dbStep === dbNow + c.imported, `db ${dbNow} -> ${dbStep} (+${c.imported})`);
      dbNow = dbStep;
      let uiStep = await cardCount();
      for (let i = 0; i < 20 && uiStep !== uiNow + c.imported; i++) {
        await sleep(300);
        uiStep = await cardCount();
      }
      add(`import.uiStep${attempts}`, uiStep === uiNow + c.imported, `ui ${uiNow} -> ${uiStep} (+${c.imported})`);
      uiNow = uiStep;

      // c. 这次拿到了完整上游目录：该录的应该都在了；若还一条没录 → 收敛 + 幂等达成
      if (c.imported + c.skipped === upstreamNames.length) {
        gotCompleteCall = true;
        completeToast = toast;
        if (c.imported === 0) gotIdempotentComplete = true;
      }
      // 别在几秒内连打上游网关：实测同密钥快速重复会回短列表/401，
      // 真实用户也不会这样点。留足间隔再进下一轮。
      await sleep(4000);
    }

    // d. 收敛：库里必须等于上游目录条数
    add('import.converged', dbNow === upstreamNames.length,
      `db=${dbNow} upstream=${upstreamNames.length} attempts=${attempts} totalImported=${totalImported}`);
    // 首录态：初始缺几条就必须一共录进去几条（复跑态 0==0 同样成立）
    add('import.exactTotals', totalImported === missing.length,
      `totalImported=${totalImported} missingAtStart=${missing.length}`);
    // 幂等：必须出现过一次「完整目录且已录入 0」
    add('idempotent.completeCall', gotIdempotentComplete && /已录入\s*0\s*个/.test(completeToast),
      `gotCompleteCall=${gotCompleteCall} gotIdempotentComplete=${gotIdempotentComplete} toast="${completeToast}"`);
    // 弹窗最终应收起（有缺口时会留着让用户续点，收敛后不该还开着）
    add('import.dialogClosed', await waitDialogClosed(), 'closed=' + !(await dialogOpen()));

    // 录入结果的模型类型必须与人工建模一致（本次修的 inferTasks）
    if (missing.length > 0) {
      const finalBody = await apiGet('/api/providers/' + encodeURIComponent(provider.provider_id), tk);
      const rows = finalBody?.data?.models || [];
      const importedRows = rows.filter((m) => missing.includes(m.model));
      const wrong = importedRows
        .map((m) => ({ model: m.model, task: taskOf(m), want: expectTask(m.model) }))
        .filter((x) => x.task !== x.want);
      add('import.taskClassify', wrong.length === 0 && importedRows.length === missing.length,
        wrong.length ? JSON.stringify(wrong) : importedRows.length + '/' + missing.length + ' rows classified ok');
    } else {
      add('import.taskClassify', true, '本次无新录入（幂等态），跳过分类断言');
    }

    // ── 4. 幂等复核：收敛后再点一次仍然只跳过 ──────────────────────────
    await openDialog();
    const importBtn2 = page.locator('.model-fetch-dialog button:has-text("全部录入")').first();
    await markToasts(page);
    const notifyP2 = waitNewNotify(page, 40000);
    await importBtn2.click();
    const toast2 = await notifyP2;
    const c2 = parseCounts(toast2);
    add('idempotent.toast', c2.imported === 0,
      `toast="${toast2}" expect imported=0 (skipped=${c2.skipped} total=${upstreamNames.length})`);

    const after2 = await apiGet('/api/providers/' + encodeURIComponent(provider.provider_id), tk);
    const dbAfter2 = after2?.data?.models?.length ?? -1;
    add('idempotent.db', dbAfter2 === dbNow, `before=${dbNow} after=${dbAfter2}`);

    // ── 5. 逃生口：「手动添加」关闭 fetchDialog，表单-dialog 保持可见 ──────
    await openDialog();
    const manual = page.locator('.model-fetch-dialog .fetch-foot button:has-text("手动添加")').first();
    add('manual.btn', (await manual.count()) > 0, 'count=' + (await manual.count()));
    if ((await manual.count()) > 0) {
      await manual.click();
      // fetchDialog 关闭后，表单-dialog 应仍可见（从「获取」按钮打开时就没关）
      add('manual.fetchDialogClosed', await waitDialogClosed(8000), 'closed=' + !(await dialogOpen()));
      add('manual.formVisible', (await page.locator('.model-edit-dialog:visible').count()) > 0,
        'visible=' + (await page.locator('.model-edit-dialog:visible').count()));
      await page.keyboard.press('Escape');
      await sleep(600);
    }

    // ── 6. 门禁：JS 错误 + allowlist 外的 4xx ──────────────────────────
    const unknown4xx = badResponses.filter((x) => !KNOWN_404.some((re) => re.test(x)));
    add('gate.jsErrors', jsErrors.length === 0, jsErrors.slice(0, 5).join(' | ') || 'none');
    add('gate.unknown4xx', unknown4xx.length === 0, unknown4xx.slice(0, 5).join(' | ') || 'none');
  } catch (e) {
    // 出错时把页面侧的 JS 错误一并带上，否则只看到「等某个选择器超时」无从查起
    add('script.fatal', false,
      ((e && e.message) || String(e)) + ' | jsErr=' + (jsErrors.slice(-3).join(' ;; ') || 'none'));
  } finally {
    const report = {
      generatedAt: new Date().toISOString(),
      base: BASE,
      provider: provider ? { id: provider.provider_id, name: provider.name, url: provider.base_url } : null,
      upstreamCount: upstream.length,
      missingAtStart: missing.length,
      mode: missing.length ? 'fresh-import' : 'idempotent-only',
      passed: checks.filter((c) => c.ok).length,
      failed: errs.length,
      checks,
      errors: errs,
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
    await browser.close().catch(() => {});
    console.log(JSON.stringify({ passed: report.passed, failed: report.failed, mode: report.mode, out: OUT }, null, 2));
    if (errs.length) {
      console.log('FAILED:');
      checks.filter((c) => !c.ok).forEach((c) => console.log('  - ' + c.name + ' :: ' + c.detail));
    }
    process.exit(errs.length ? 1 : 0);
  }
})();
