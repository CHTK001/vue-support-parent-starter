const { chromium } = require('playwright');
const BASE = 'http://localhost:15689';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROUTES = ['/', '/agents', '/skills', '/characters', '/bots', '/setting/general',
  '/knowledge-base', '/image-generate', '/plugins', '/connectors', '/usage', '/roles'];
const LOGIN = `(() => true)`;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[type="password"]', { timeout: 40000 });
  await sleep(1500);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.locator('button:has-text("登")').first().click();
  try { await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }); } catch {}
  await sleep(2000);
  const BASE_SEL = 'button,[role="button"],.el-button,.re-button,.rs-btn,a[href],.el-dropdown-menu__item,[class*="icon-btn"],[class*="iconBtn"]';
  for (const u of ROUTES) {
    await page.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
    await sleep(4000);
    const info = await page.evaluate((bsel) => {
      const out = { base: 0, ptrNamed: 0, ptrUnnamed: 0, tab: 0, vueOnClick: 0, samples: [] };
      const baseSet = new Set(document.querySelectorAll(bsel));
      out.base = baseSet.size;
      const check = (el, kind) => {
        if (baseSet.has(el)) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const name = (el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').trim()).replace(/\s+/g, ' ').slice(0, 24);
        if (kind === 'tab') out.tab++;
        else if (name) { out.ptrNamed++; if (out.samples.length < 8) out.samples.push('N ' + el.tagName + '.' + String(el.className || '').slice(0, 40) + ' :: ' + name); }
        else { out.ptrUnnamed++; if (out.samples.length < 12) out.samples.push('U ' + el.tagName + '.' + String(el.className || '').slice(0, 50)); }
        const keys = Object.keys(el);
        const vk = keys.filter((k) => /vue|vnode|__v/i.test(k));
        if (vk.length && out.vueOnClick < 3) out.samples.push('VUEKEY ' + el.tagName + ' ' + vk.join(',') + ' :: ' + name);
        if (vk.length) out.vueOnClick++;
      };
      // 计算样式 cursor:pointer 但不在基础选择器里的元素
      for (const el of document.querySelectorAll('div,span,li,td,th,label,img,svg')) {
        if (getComputedStyle(el).cursor === 'pointer') check(el, 'ptr');
      }
      for (const el of document.querySelectorAll('[tabindex]')) {
        if (el.getAttribute('tabindex') !== '-1') check(el, 'tab');
      }
      return out;
    }, BASE_SEL);
    console.log(u + ' base=' + info.base + ' ptrNamed=' + info.ptrNamed + ' ptrUnnamed=' + info.ptrUnnamed
      + ' tab=' + info.tab + ' vueKeyEls=' + info.vueOnClick);
    info.samples.forEach((s) => console.log('    ' + s));
  }
  await browser.close();
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(1); });
