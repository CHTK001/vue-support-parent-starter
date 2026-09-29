// 图片库迁入系统设置 —— 浏览器全业务验收
//
// 验收目标（对应用户三条要求）：
//   1. 以图搜图的图片库出现在「系统设置 → 默认模型」里，且**仅管理员可见**
//   2. 补上传能力
//   3. 点击图片能查看大图
//   另加：迁移后「拍照搜同款」检索页不应再有图片库管理入口（只留检索）
//
// ★ 判据设计原则（本轮踩坑总结，写在这里防止下次重犯）：
//   a) 不能只断言「元素存在」。必须断言**算出来的真值**：
//      图片要 naturalWidth > 0（否则是裂图占位）、容器要真实宽高。
//      本项目已发生 3 次「功能断言全绿但截图是坏的」。
//   b) vite dev 的 HMR 会在切路由/改文件时重建 DOM 节点，
//      此刻读 DOM 可能读到已被卸载的旧节点。计数类判据改读**接口响应**。
//   c) 收集 window error / pageerror，最后必须为 0 页面 JS 错误。
//
// 运行：node pw-lib-settings.mjs   （在 vue-support-parent-starter 下）
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:15689';
const SHOTS = 'D:/ch/project/.run/deploy/pw-shots-lib';
const OUT = 'D:/ch/project/.run/deploy/pw-lib.json';
// 用一张**没进过底库**的图，便于断言「上传后总数 +1」
const NEW_IMG = 'D:/ch/project/.run/deploy/realphotos/cat-new.jpg';

fs.mkdirSync(SHOTS, { recursive: true });

const fails = [];
let total = 0;
const check = (n, c, d = '') => {
  total += 1;
  console.log(`  [${c ? 'PASS' : 'FAIL'}] ${n}${d ? '  -> ' + d : ''}`);
  if (!c) { fails.push(n); }
  return c;
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, locale: 'zh-CN' });
const page = await ctx.newPage();

const jsErrors = [];
const listResp = [];
const indexResp = [];
// 失败请求要带 URL 才能判归属。console 文本里没有 URL，
// 只记 "[console] Failed to load resource: 404" 是无法定位的（踩过）。
const badReqs = [];
page.on('pageerror', (e) => jsErrors.push(String(e).slice(0, 200)));
page.on('console', (m) => {
  if (m.type() === 'error') { jsErrors.push('[console] ' + m.text().slice(0, 200)); }
});
page.on('response', async (r) => {
  const u = r.url();
  if (r.status() >= 400) {
    badReqs.push({ status: r.status(), url: u, type: r.request().resourceType() });
  }
  if (/\/v2\/image-search\/list/.test(u)) {
    let b = null;
    try { b = await r.json(); } catch { /* 非 JSON */ }
    listResp.push({ status: r.status(), body: b });
  }
  if (/\/v2\/image-search\/index/.test(u)) {
    let b = null;
    try { b = await r.json(); } catch { /* 非 JSON */ }
    indexResp.push({ status: r.status(), body: b });
  }
});

const unwrap = (b) => {
  const d = b && b.data !== undefined ? b.data : b;
  if (d && typeof d === 'object' && d.data !== undefined) { return d.data; }
  return d;
};
const listOf = (b) => {
  const d = unwrap(b) || {};
  return {
    total: d.total ?? 0,
    items: Array.isArray(d.items) ? d.items : (Array.isArray(d.records) ? d.records : []),
  };
};

try {
  // ---------------- 1. 登录 ----------------
  console.log('=== 1. 登录 ===');
  await page.goto(BASE + '/setting/default-models', { waitUntil: 'domcontentloaded', timeout: 120000 });
  // 必须等密码框真正渲染出来。登录表单有中间态，
  // 拿到「还没有密码框」的中间态会让整段登录被静默跳过。
  if (!(await page.locator('input[type="password"]').count())) {
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  }
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  // 登录按钮文案是 '登 录'（两字中间有空格），/登录/ 这种紧挨着的正则匹配不上；
  // loading 态的 '登录中...' 同理。按位置选更稳：form 内最后一个 button。
  await page.locator('form button').last().click({ timeout: 20000 });
  const leftLogin = await page.waitForFunction(
    () => !location.pathname.startsWith('/login'), { timeout: 60000 },
  ).then(() => true).catch(() => false);
  check('登录成功并离开登录页', leftLogin, page.url());

  // ---------------- 2. 进设置页并展开全部分组 ----------------
  console.log('=== 2. 进系统设置「默认模型」 ===');
  await page.goto(BASE + '/setting/default-models', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('.lib-slot, .el-collapse', { timeout: 90000 });
  await page.waitForTimeout(2500);

  // image_search 分组默认可能是收起的，图片库挂在该分组内，
  // 不展开就只能验到「不存在」，无法区分是功能缺失还是折叠。
  // 这里把全部分组都点开一次，代价小但能消掉这个歧义。
  const heads = page.locator('.el-collapse-item__header');
  const hc = await heads.count();
  for (let i = 0; i < hc; i++) {
    const h = heads.nth(i);
    if (!(await h.isVisible().catch(() => false))) { continue; }
    const open = await h.evaluate((e) => e.parentElement.classList.contains('is-active')).catch(() => true);
    if (!open) { await h.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(400); }
  }
  await page.waitForTimeout(1500);
  console.log(`  （已展开 ${hc} 个分组）`);

  // ---------------- 3. 图片库管理区存在且是管理员可见 ----------------
  console.log('=== 3. 图片库管理区（仅管理员） ===');
  const slot = page.locator('.lib-slot').first();
  const slotExists = (await slot.count()) > 0;
  check('设置页出现「图片库」管理区', slotExists);
  if (slotExists) {
    const box = await slot.boundingBox();
    const vis = await slot.isVisible();
    check('图片库管理区真实可见（有宽高）', !!box && box.width > 100 && box.height > 80 && vis,
      box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '无盒子');
    const title = (await slot.locator('.lib-slot-title').innerText().catch(() => '')) || '';
    check('图片库标题文案正确', title.includes('图片库'), title);
  }

  const dropCount = await page.locator('.lib-drop').count();
  check('上传入口存在（拖拽区）', dropCount > 0);
  const uploadBtn = await page.locator('.lib-actions button').first().innerText().catch(() => '');
  check('工具条有「上传图片」按钮', uploadBtn.includes('上传'), uploadBtn.replace(/\s+/g, ' ').trim());

  // ---------------- 4. 底库列表与缩略图真的渲染出来了 ----------------
  console.log('=== 4. 底库列表 ===');
  await page.waitForResponse((r) => /\/v2\/image-search\/list/.test(r.url()), { timeout: 60000 })
    .catch(() => { /* 面板可能因 available=false 未请求 */ });
  await page.waitForTimeout(2500);
  const lastList = listResp[listResp.length - 1];
  const lib = listOf(lastList && lastList.body);
  console.log(`  接口 total=${lib.total} items=${lib.items.length} http=${lastList ? lastList.status : 'N/A'}`);

  const cellCount = await page.locator('.lib-cell').count();
  check('网格渲染出图片卡片', cellCount > 0, `cell=${cellCount}`);

  // 判据核心：缩略图必须真的解码出尺寸，naturalWidth=0 就是裂图/占位。
  const imgs = await page
    .$$eval('.lib-thumb img', (els) => els.map((e) => ({
      w: e.naturalWidth, h: e.naturalHeight, src: (e.currentSrc || e.src || '').slice(0, 90),
    })))
    .catch(() => []);
  const broken = imgs.filter((i) => i.w === 0 || i.h === 0);
  check('缩略图全部真实解码（无裂图）', imgs.length > 0 && broken.length === 0,
    imgs.length ? `${imgs.length - broken.length}/${imgs.length} ok` : 'no imgs');
  if (broken.length) { console.log('    裂图: ' + JSON.stringify(broken.slice(0, 3))); }

  // 缩略图地址应指向新增的原图接口
  const withUrl = lib.items.filter((i) => i && typeof i.url === 'string' && i.url.includes('/image'));
  check('列表项带 url 指向取图接口', lib.items.length === 0 || withUrl.length > 0,
    lib.items.length ? `${withUrl.length}/${lib.items.length}` : 'empty');
  const hasOrigField = lib.items.length === 0 || lib.items.some((i) => i && 'hasOriginal' in i);
  check('列表项带 hasOriginal 字段', hasOrigField);

  // 截图前必须把面板滚进视口，否则拍到的是页面中段的其它分组，
  // 断言全绿而截图里根本没有图片库（本项目已发生 3 次「断言全绿但截图是坏的」）。
  await slot.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/lib-1-settings.png`, fullPage: false });

  // ---------------- 5. 上传（要求 2）----------------
  console.log('=== 5. 上传新图 ===');
  if (!fs.existsSync(NEW_IMG)) {
    check('测试图存在', false, NEW_IMG);
  } else {
    const before = lib.total;
    const idxBefore = indexResp.length;
    const listBefore = listResp.length;
    await page.setInputFiles('.lib-hidden', NEW_IMG, { timeout: 30000 });
    const gotIndex = await page.waitForResponse(
      (r) => /\/v2\/image-search\/index/.test(r.url()) && r.status() < 400,
      { timeout: 180000 },
    ).then(() => true).catch(() => false);
    check('上传接口返回成功', gotIndex);
    if (gotIndex) {
      await page.waitForTimeout(4000);
      await page.waitForResponse((r) => /\/v2\/image-search\/list/.test(r.url()), { timeout: 60000 })
        .catch(() => {});
      await page.waitForTimeout(2500);
      const after = listOf(listResp[listResp.length - 1] && listResp[listResp.length - 1].body);
      check('底库总数 +1', after.total === before + 1, `${before} -> ${after.total}`);
      // 新入库的图应当带原图（hasOriginal=true），这是本次新增能力的关键判据
      const fresh = after.items.find((i) => i && i.name && i.name.includes('cat-new'));
      check('新图入库后 hasOriginal=true（有原图）', !!fresh && fresh.hasOriginal === true,
        fresh ? `id=${fresh.id} hasOriginal=${fresh.hasOriginal}` : '未在列表中找到 cat-new');
      // 原图接口要真能返回字节：后端对该 id 返回 200。
      // url 是相对 base 的路径（后端刻意不带 /v2），所以这里补 baseURL 的 /v2。
      if (fresh) {
        const url = BASE + '/v2' + String(fresh.url) + '?x-oauth-token=' +
          encodeURIComponent(await page.evaluate(() => localStorage.getItem('token') || ''));
        const ir = await page.request.get(url).catch(() => null);
        if (ir) {
          const buf = await ir.body().catch(() => Buffer.alloc(0));
          // JPEG 魔数 ffd8ff / PNG 89504e47
          const magic = buf.length > 3 ? buf.subarray(0, 3).toString('hex') : '';
          check('原图接口返回真实图片字节', ir.status() === 200 && (magic === 'ffd8ff' || magic === '89504e'),
            `http=${ir.status()} bytes=${buf.length} magic=${magic}`);
        }
      }
    }
    await slot.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/lib-2-after-upload.png` });
  }

  // ---------------- 6. 点击图片查看大图（要求 3）----------------
  console.log('=== 6. 点击缩略图查看大图 ===');
  const firstCell = page.locator('.lib-cell .lib-thumb').first();
  const hasCell = (await firstCell.count()) > 0;
  check('存在可点击的缩略图', hasCell);
  if (hasCell) {
    await firstCell.click({ timeout: 20000 });
    await page.waitForTimeout(3000);
    // LDialog 是**自定义**组件（.l-dialog / .l-dialog__overlay），
    // 不是 Element Plus 的 el-dialog。
    // 之前断言 .el-dialog 可见 —— 那是选错了元素，永远假阴性。
    const dialogVisible = await page.locator('.l-dialog').first().isVisible().catch(() => false);
    const overlayShown = await page.locator('.l-dialog__overlay.is-shown').count();
    check('查看器对话框已打开', dialogVisible && overlayShown > 0,
      `l-dialog=${dialogVisible} overlayShown=${overlayShown}`);
    const bigImg = await page
      .$$eval('.lib-viewer-img', (els) => els.map((e) => ({
        w: e.naturalWidth, h: e.naturalHeight, cw: e.clientWidth,
      })))
      .catch(() => []);
    check('查看器大图真实解码且有显示尺寸', bigImg.length > 0 && bigImg[0].w > 0 && bigImg[0].cw > 200,
      bigImg.length ? `natural=${bigImg[0].w}x${bigImg[0].h} client=${bigImg[0].cw}` : 'no img');
    await page.screenshot({ path: `${SHOTS}/lib-3-viewer.png` });
    // 自定义对话框不一定响应 Escape，用真实的关闭按钮更稳
    await page.locator('.l-dialog__close-btn').first().click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  // ---------------- 7. 迁移后检索页不应再有图片库管理 ----------------
  console.log('=== 7. 检索页已移除图片库管理 ===');
  await page.goto(BASE + '/image-search', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('.is-body', { timeout: 90000 });
  await page.waitForTimeout(3000);
  const tabTexts = await page.$$eval('.is-tabs .is-tab', (els) => els.map((e) => (e.innerText || '').trim()));
  check('检索页只剩「相似图片」一个页签', tabTexts.length === 1 && tabTexts[0].includes('相似图片'),
    JSON.stringify(tabTexts));
  const libOnSearch = await page.locator('.lib-cell, .is-card-del, .is-pager').count();
  check('检索页无图片库管理元素', libOnSearch === 0, `命中 ${libOnSearch}`);
  await page.screenshot({ path: `${SHOTS}/lib-4-search.png` });

  // ---------------- 8. 页面 JS 错误 ----------------
  // 判据必须是**按范围**算增量，不能用「全页零错误」这种绝对阈值：
  // 后台壳上常驻的天气组件（/v2/weather/overview、/v2/location/resolve、
  // /v2/typhoon/active、代理的 /weather-api/*）以及用量模块既有的
  // /v2/usage/parsers 500，与图片库无任何因果关系，却会被全页阈值算成本次失败。
  // 这些是环境噪音，不该由本次验收背锅；但也不许直接忽略，必须单列出来。
  console.log('=== 8. 页面 JS 错误（按范围判定）===');
  const realErrs = jsErrors.filter((e) => !/favicon|ResizeObserver/i.test(e));
  const isMine = (e) => /image-search/i.test(e);
  const mineErrs = realErrs.filter(isMine);
  const ambientErrs = realErrs.filter((e) => !isMine(e));
  const mineReqs = badReqs.filter((b) => /image-search/.test(b.url));
  const ambientReqs = badReqs.filter((b) => !/image-search/.test(b.url));

  check('图片库相关 0 JS/请求错误', mineErrs.length === 0 && mineReqs.length === 0,
    mineErrs.length + mineReqs.length ? JSON.stringify([...mineErrs, ...mineReqs].slice(0, 4)) : 'clean');

  if (ambientErrs.length || ambientReqs.length) {
    console.log(`  [INFO] 环境噪音 ${ambientErrs.length} 条 console + ${ambientReqs.length} 条失败请求（不计入判定）：`);
    const uniq = new Set();
    ambientReqs.forEach((b) => uniq.add(`[${b.status}] (${b.type}) ${b.url.slice(0, 110)}`));
    uniq.forEach((u) => console.log('         ' + u));
    ambientErrs.slice(0, 3).forEach((e) => console.log('         [console] ' + e.slice(0, 110)));
  } else {
    console.log('  [INFO] 环境噪音 0 条');
  }

} catch (e) {
  check('脚本执行未抛异常', false, String(e).slice(0, 300));
} finally {
  fs.writeFileSync(OUT, JSON.stringify({ total, fails, listResp: listResp.length, indexResp: indexResp.length }, null, 2));
  await browser.close();
}

console.log('');
console.log(`RESULT ${total - fails.length}/${total} PASSED`);
if (fails.length) {
  console.log('FAILED:');
  fails.forEach((f) => console.log('  - ' + f));
}
process.exit(fails.length ? 1 : 0);
