// 诊断：把「页面 JS 错误」这项 FAIL 背后的真实 URL 抓出来
//
// 背景：pw-lib-settings.mjs 19/20，唯一 FAIL 是「0 页面 JS 错误」，
// 报 2 个 404 + 1 个 usage/parsers 500，但脚本只记了 console 文本没记 URL。
// 这里专门补上 URL + 资源类型 + 发起页，用来判断是本次改动引入还是既有噪声。
//
// 判读原则（不要一看到 404 就当成 bug）：
//   先看 URL 里有没有 image-search —— 没有就与图片库无关，
//   再看是不是 dev server 的模块/图标请求 —— 那类与业务无关。
//   真正要抓的是「业务接口 4xx/5xx」。
//
// 运行：node pw-err-diag.mjs   （在 vue-support-parent-starter 下）
import { chromium } from 'playwright';

const BASE = 'http://localhost:15689';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, locale: 'zh-CN' });
const page = await ctx.newPage();

const bad = [];
page.on('response', async (r) => {
  const s = r.status();
  if (s < 400) { return; }
  const u = r.url();
  let body = '';
  if ((r.headers()['content-type'] || '').includes('json')) {
    try { body = (await r.text()).slice(0, 220); } catch { /* 已释放 */ }
  }
  bad.push({ status: s, url: u, type: r.request().resourceType(), body });
});
page.on('requestfailed', (r) => {
  bad.push({ status: 0, url: r.url(), type: r.resourceType(), body: 'REQUEST_FAILED ' + (r.failure()?.errorText || '') });
});

const visit = async (path, label) => {
  const before = bad.length;
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(6000);
  console.log(`\n--- ${label} (${path}) 新增失败请求 ${bad.length - before} 条 ---`);
  bad.slice(before).forEach((b) => {
    const mine = /image-search/.test(b.url) ? '  ★图片库相关' : '';
    console.log(`  [${b.status || 'FAIL'}] (${b.type}) ${b.url.slice(0, 150)}${mine}`);
    if (b.body) { console.log(`        body: ${b.body}`); }
  });
};

try {
  console.log('=== 登录 ===');
  await page.goto(BASE + '/setting/default-models', { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (!(await page.locator('input[type="password"]').count())) {
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
  }
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('form button').last().click({ timeout: 20000 });
  await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 60000 });
  console.log('  登录 OK');

  // 清掉登录页产生的噪声，只看业务页
  bad.length = 0;

  await visit('/setting/default-models', '设置页「默认模型」');
  // 展开全部分组，制造与验收脚本一致的触发条件
  const heads = page.locator('.el-collapse-item__header');
  const hc = await heads.count();
  for (let i = 0; i < hc; i++) {
    const h = heads.nth(i);
    if (!(await h.isVisible().catch(() => false))) { continue; }
    const open = await h.evaluate((e) => e.parentElement.classList.contains('is-active')).catch(() => true);
    if (!open) { await h.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(400); }
  }
  await page.waitForTimeout(3000);
  console.log(`  展开 ${hc} 个分组后，失败请求累计 ${bad.length} 条`);
  bad.filter((b) => /image-search/.test(b.url)).forEach((b) => {
    console.log(`  [${b.status}] (${b.type}) ★图片库 ${b.url.slice(0, 150)}`);
  });

  bad.length = 0;
  await visit('/image-search', '检索页「拍照搜同款」');
} finally {
  console.log('\n=== 汇总：全部失败请求 ===');
  const seen = new Map();
  bad.forEach((b) => seen.set(b.status + ' ' + b.url, b));
  seen.forEach((b) => console.log(`  [${b.status || 'FAIL'}] (${b.type}) ${b.url.slice(0, 160)}`));
  console.log('=== DIAG_DONE ===');
  await browser.close();
}
