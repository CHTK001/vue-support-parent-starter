/**
 * OCR 文本矫正（corrector_model）生产级验收：API 契约 + 浏览器交互双层断言。
 *
 * 非必填三约定（留空=关闭 / 不阻断主链路 / 失败保留原文）中，本脚本验收
 * 应用层可观测面；引擎层 fail-open 由 OcrCorrectorWiringTest 覆盖。
 *
 * API 层
 *   1. GET /v2/settings/ocr 含 corrector_model，默认空串（留空=关闭）
 *   2. PUT corrector_model=macbert4csc → 回读持久化；合并语义不伤其它字段
 *   3. GET /v2/rag/options 的 ocrModels 含 macbert4csc（选择器有得选）
 *   4. GET /v2/pipelines/ocr 描述声明「文本矫正…非必填…留空关闭」
 *   5. 收尾恢复空串（默认关闭态）
 *
 * 浏览器层 /capabilities/ocr
 *   6. 中文标签「文本矫正模型」+ FIELD_PLACEHOLDERS 提示渲染（非英文兜底 key）
 *   7. 「刷新」按钮可见、带图标、可点，点后不炸且值回读服务端
 *   8. 输入 macbert4csc → 点「保存配置」→ 捕获 PUT 载荷含 corrector_model 且响应成功
 *   9. 重载页面值仍在（持久化）；清空再保存 → 关闭态可逆
 *
 * 浏览器层 /setting/default-models
 *  10. 「文本矫正模型」行渲染为模型选择器；对话框搜索 macbert 命中 macbert4csc
 *  11. 选中不保存 → 重载后不产生脏写（全局值仍为空）
 *  12. 全程零 pageerror、零 5xx、零 /v2/ 控制台错误
 *
 * 用法（需本机 dev + 指向含 corrector_model 的后端）：
 *   set NODE_PATH=D:\ch\project\vue-support-parent-starter\node_modules
 *   set BASE=http://localhost:15690
 *   node src/acceptance/ocr-corrector-accept.cjs
 * 退出码 0=全绿，1=有 FAIL。
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:15690';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';
const MODEL = 'macbert4csc';

let pass = 0;
let fail = 0;
const failures = [];
const warns = [];

function ok(name, cond, extra = '') {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${extra ? ` | ${extra}` : ''}`);
    console.log(`  FAIL  ${name}${extra ? ` | ${extra}` : ''}`);
  }
}

function warn(name, extra = '') {
  warns.push(`${name}${extra ? ` | ${extra}` : ''}`);
  console.log(`  WARN  ${name}${extra ? ` | ${extra}` : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, token, body) {
  const init = { method, headers: {} };
  if (token) init.headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const r = await fetch(BASE + path, init);
  let json = null;
  try { json = await r.json(); } catch { /* 非 JSON 原文留空 */ }
  return { status: r.status, json };
}

async function main() {
  console.log(`[1] API 层  BASE=${BASE}`);

  // ---- 登录拿令牌 ----
  const login = await api('POST', '/v2/user/login', null, { username: USER, password: PASS });
  ok('POST /v2/user/login 登录', !!login.json?.success, `status=${login.status}`);
  const token = login.json?.data?.accessToken;
  ok('登录返回 accessToken', !!token);

  // ---- 1. corrector_model 字段存在 + 默认空串 ----
  let ocr = await api('GET', '/v2/settings/ocr', token);
  const data = ocr.json?.data?.data || {};
  ok('GET /v2/settings/ocr 含 corrector_model 字段', 'corrector_model' in data,
    `fields=${Object.keys(data).join(',')}`);
  const initial = data.corrector_model;
  // 初值不必为空（可能是上轮测试写入的），语义只要求「可空=关闭」：
  // 下面的归一 + 回读才是空串语义的硬断言。
  ok('corrector_model 为字符串（空串=关闭的语义前提）', typeof initial === 'string',
    `value=[${initial}]`);

  // 若初值非空则归一到空（保证后续断言起点一致）
  if (initial !== '') {
    await api('PUT', '/v2/settings/ocr', token, { corrector_model: '' });
    ocr = await api('GET', '/v2/settings/ocr', token);
    ok('归一到空串成功', ocr.json?.data?.data?.corrector_model === '');
  }

  // ---- 2. PUT 持久化 + 合并语义 ----
  const before = ocr.json?.data?.data || {};
  const put = await api('PUT', '/v2/settings/ocr', token, { corrector_model: MODEL });
  ok('PUT corrector_model=macbert4csc 成功', !!put.json?.success, `code=${put.json?.code}`);
  ocr = await api('GET', '/v2/settings/ocr', token);
  const after = ocr.json?.data?.data || {};
  ok('回读持久化 = macbert4csc', after.corrector_model === MODEL, `value=[${after.corrector_model}]`);
  ok('合并语义：其余字段未被清空',
    after.detector_threshold === before.detector_threshold &&
    after.device === before.device &&
    after.sort_reading_order === before.sort_reading_order,
    `threshold=[${after.detector_threshold}] device=[${after.device}]`);

  // ---- 3. rag options 供选择 ----
  const opt = await api('GET', '/v2/rag/options', token);
  const ocrModels = opt.json?.data?.ocrModels || [];
  ok('GET /v2/rag/options ocrModels 含 macbert4csc', ocrModels.includes(MODEL),
    `ocrModels=[${ocrModels.join(',')}]`);

  // ---- 4. 管线描述声明非必填 ----
  const det = await api('GET', '/v2/pipelines/ocr', token);
  const detStr = JSON.stringify(det.json || {});
  ok('GET /v2/pipelines/ocr 描述含「文本矫正」', detStr.includes('文本矫正'));
  ok('描述声明「非必填」与「留空关闭」', detStr.includes('非必填') && detStr.includes('留空关闭'));

  // ---- 5. 恢复空串（关闭态）----
  await api('PUT', '/v2/settings/ocr', token, { corrector_model: '' });
  ocr = await api('GET', '/v2/settings/ocr', token);
  ok('API 层收尾：corrector_model 恢复空串', ocr.json?.data?.data?.corrector_model === '');

  console.log('[2] 浏览器层  /capabilities/ocr');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const serverErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/favicon|ERR_ABORTED|Download the Vue Devtools|WebSocket/i.test(t)) return;
    consoleErrors.push(t.split('\n')[0].slice(0, 200));
  });
  page.on('response', (r) => {
    if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url()}`);
  });

  try {
    // ---- UI 登录（同 ui-click-sweep 选择器）----
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('input[type="password"]', { timeout: 40000 });
    await sleep(1800);
    await page.locator('input[type="text"]').first().fill(USER);
    await page.locator('input[type="password"]').first().fill(PASS);
    await page.locator('button').filter({ hasText: /登\s*录/ }).first().click();
    try {
      await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 });
    } catch { /* 以最终 URL 判定，不因等待超时直接崩 */ }
    const leftLogin = !/\/login/.test(new URL(page.url()).pathname);
    ok('UI 登录成功（路由离开 /login）', leftLogin, `url=${page.url()}（失败常见原因：后端 CORS 白名单未含 ${BASE}）`);
    if (!leftLogin) {
      failures.forEach((f) => console.log('  - ' + f));
      console.log(`========== 提前终止：UI 登录失败 PASS=${pass} FAIL=${fail} ==========`);
      await browser.close();
      process.exit(1);
    }

    await page.goto(BASE + '/capabilities/ocr', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // ---- 6. 标签与占位提示 ----
    const label = page.locator('.el-form-item__label, label').filter({ hasText: '文本矫正模型' }).first();
    await label.waitFor({ timeout: 30000 }).catch(() => {});
    ok('「文本矫正模型」中文标签渲染（FIELD_LABELS 生效）', await label.isVisible());

    const corrInput = page.locator('input[placeholder*="macbert4csc"]').first();
    await corrInput.waitFor({ timeout: 30000 }).catch(() => {});
    ok('corrector 输入框渲染且占位含 macbert4csc 提示', await corrInput.isVisible());
    const ph = (await corrInput.count()) ? await corrInput.getAttribute('placeholder') : '';
    ok('占位文案为中文提示（非英文兜底）', /[一-龥]/.test(String(ph)), `placeholder=[${ph}]`);

    // 管线描述（标题下副文案）
    const descText = await page.locator('h1 + p, .text-sm').first().textContent().catch(() => '');
    const pageDesc = await page.evaluate(() => document.body.innerText);
    ok('页面声明「文本矫正…非必填」', pageDesc.includes('文本矫正') && pageDesc.includes('非必填'));

    // ---- 7. 刷新按钮 ----
    const refreshBtn = page.locator('button').filter({ hasText: '刷新' }).first();
    ok('「刷新」按钮可见', await refreshBtn.isVisible());
    ok('「刷新」按钮可用（未禁用）', !(await refreshBtn.isDisabled()));
    const refreshIcon = await refreshBtn.locator('svg, .el-icon').count();
    ok('「刷新」按钮带图标', refreshIcon > 0, `iconCount=${refreshIcon}`);
    const errsBefore = pageErrors.length + serverErrors.length;
    await refreshBtn.click();
    await sleep(2500);
    await corrInput.waitFor({ timeout: 15000 }).catch(() => {});
    ok('点「刷新」后不炸（无 pageerror/5xx）',
      pageErrors.length === errsBefore && serverErrors.length === errsBefore,
      `pageErr=${pageErrors.length} srv=${serverErrors.length}`);
    ok('刷新后值回读服务端（空串）', (await corrInput.inputValue()) === '',
      `value=[${await corrInput.inputValue()}]`);

    // ---- 8. 输入 + 保存配置 ----
    const putsSeen = [];
    const onResponse = async (r) => {
      const req = r.request();
      if (req.method() !== 'PUT') return;
      const pd = req.postData();
      if (!pd || !pd.includes('corrector_model')) return;
      let bodyOk = null;
      try { bodyOk = (await r.json())?.success; } catch { /* 忽略 */ }
      putsSeen.push({ url: r.url(), status: r.status(), payload: pd, success: bodyOk });
    };
    page.on('response', onResponse);

    await corrInput.fill(MODEL);
    const saveBtn = page.locator('button').filter({ hasText: '保存配置' }).first();
    ok('「保存配置」按钮可见', await saveBtn.isVisible());
    const errsBeforeSave = pageErrors.length + serverErrors.length;
    await saveBtn.click();

    // 等 PUT 落地
    let saved = null;
    for (let i = 0; i < 40 && !saved; i++) {
      await sleep(250);
      saved = putsSeen.find((p) => p.status < 400);
    }
    ok('保存触发 PUT /settings/ocr 且载荷含 corrector_model', !!saved,
      `puts=${putsSeen.map((p) => `${p.status}`).join(',')}`);
    if (saved) {
      const payload = JSON.parse(saved.payload);
      const val = payload.corrector_model ?? payload.data?.corrector_model ??
        (payload.ocr ? payload.ocr.corrector_model : undefined);
      ok(`PUT 载荷 corrector_model=${MODEL}`, val === MODEL, `payload=${saved.payload.slice(0, 300)}`);
      ok('PUT 响应 success=true', saved.success === true, `status=${saved.status}`);
    }
    // 成功 toast
    const toast = page.locator('.el-message--success').first();
    const hasToast = await toast.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    ok('保存成功提示（el-message success）', hasToast);
    ok('保存动作不炸（无 pageerror/5xx）', pageErrors.length === errsBeforeSave && serverErrors.length === errsBeforeSave,
      `pageErr=${pageErrors.length} srv=${serverErrors.length}`);
    page.off('response', onResponse);

    // ---- 9. 重载持久化 + 可逆关闭 ----
    await page.reload({ waitUntil: 'domcontentloaded' });
    const corrInput2 = page.locator('input[placeholder*="macbert4csc"]').first();
    await corrInput2.waitFor({ timeout: 30000 }).catch(() => {});
    ok('重载后值仍在 = macbert4csc（持久化）', (await corrInput2.inputValue()) === MODEL,
      `value=[${await corrInput2.inputValue()}]`);

    await corrInput2.fill('');
    const putsSeen2 = [];
    const onResponse2 = async (r) => {
      const req = r.request();
      if (req.method() !== 'PUT') return;
      const pd = req.postData();
      if (pd && pd.includes('corrector_model')) {
        let bodyOk = null;
        try { bodyOk = (await r.json())?.success; } catch { /* 忽略 */ }
        putsSeen2.push({ status: r.status(), success: bodyOk, payload: pd });
      }
    };
    page.on('response', onResponse2);
    await page.locator('button').filter({ hasText: '保存配置' }).first().click();
    let cleared = null;
    for (let i = 0; i < 40 && !cleared; i++) {
      await sleep(250);
      cleared = putsSeen2.find((p) => p.status < 400);
    }
    page.off('response', onResponse2);
    ok('清空保存成功（关闭态可逆）', !!cleared && cleared.success === true,
      `puts=${putsSeen2.map((p) => p.status).join(',')}`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const corrInput3 = page.locator('input[placeholder*="macbert4csc"]').first();
    await corrInput3.waitFor({ timeout: 30000 }).catch(() => {});
    ok('重载后值为空（回到默认关闭）', (await corrInput3.inputValue()) === '',
      `value=[${await corrInput3.inputValue()}]`);

    console.log('[3] 浏览器层  /setting/default-models');
    await page.goto(BASE + '/setting/default-models', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const row = page.locator('.set-row').filter({ hasText: '文本矫正模型' }).first();
    await row.waitFor({ timeout: 45000 }).catch(() => {});
    const rowVisible = await row.isVisible().catch(() => false);
    ok('「文本矫正模型」设置行渲染（labelMap 生效）', rowVisible,
      rowVisible ? '' : `set-row total=${await page.locator('.set-row').count()}`);

    const picker = row.locator('input[readonly]').first();
    const pickerVisible = rowVisible && await picker.isVisible().catch(() => false);
    ok('corrector 行为模型选择器（readonly 输入）', pickerVisible);
    if (pickerVisible) {

    const errsBeforeDialog = pageErrors.length + serverErrors.length;
    await picker.click();
    const dialog = page.locator('.el-dialog, .l-dialog').filter({ hasText: '选择模型' }).first();
    const dialogVisible = await dialog.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    ok('点击打开「选择模型」对话框', dialogVisible);

    const search = page.locator('input[placeholder="搜索模型..."]').first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('macbert');
      await sleep(800);
    }
    const option = (dialogVisible ? dialog : page).getByText(MODEL, { exact: false }).first();
    const optionVisible = await option.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    ok(`对话框搜索命中 ${MODEL}（ocrModels 来自 /rag/options）`, optionVisible);

    if (optionVisible) {
      await option.click();
      await sleep(600);
      const dialogGone = !(await dialog.isVisible().catch(() => false));
      ok('选中后对话框关闭', dialogGone);
      const shown = await picker.inputValue().catch(() => '');
      ok('选择器回显所选模型', shown.includes('macbert'), `display=[${shown}]`);
    } else if (dialogVisible) {
      await page.keyboard.press('Escape');
    }
    } // if (pickerVisible)

    // 不保存直接重载：不产生脏写
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1500);
    const ocrFinal = await api('GET', '/v2/settings/ocr', token);
    ok('未保存选择不产生脏写（全局 corrector 仍为空）',
      ocrFinal.json?.data?.data?.corrector_model === '',
      `value=[${ocrFinal.json?.data?.data?.corrector_model}]`);

    // ---- 12. 全程错误面 ----
    ok('全程零 pageerror', pageErrors.length === 0, pageErrors.slice(0, 3).join(' ; '));
    ok('全程零 5xx 响应', serverErrors.length === 0, serverErrors.slice(0, 3).join(' ; '));
    const apiConsoleErrs = consoleErrors.filter((t) => /\/v2\/|\/settings|\/rag\//.test(t));
    ok('零 /v2/ API 控制台错误', apiConsoleErrs.length === 0, apiConsoleErrs.slice(0, 3).join(' ; '));
    if (consoleErrors.length > apiConsoleErrs.length) {
      warn('非 API 控制台错误（不计入失败）', consoleErrors.filter((t) => !/\/v2\/|\/settings|\/rag\//.test(t)).slice(0, 3).join(' ; '));
    }
  } finally {
    await browser.close();
  }

  console.log('');
  console.log(`========== OCR 文本矫正验收结果：PASS=${pass} FAIL=${fail} WARN=${warns.length} ==========`);
  if (failures.length) {
    console.log('失败清单：');
    failures.forEach((f) => console.log('  - ' + f));
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('脚本异常终止：', e);
  process.exit(1);
});
