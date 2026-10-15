/**
 * 采集调度一体化平台全应用「可点击元素」逐个可用性验收（生产级遍历，不抽样）。
 * 复制自 pages/ai 的 ui-click-sweep.cjs，仅替换应用路由、登录账号与输出目录。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const UPLOAD_NAME = process.env.SWEEP_UPLOAD_NAME || 'accept-probe-sweep.png';
function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makePng(w, h, rgb) {
  const stride = w * 3 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * stride + 1 + x * 3;
      raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2];
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const UPLOAD_FILE = { name: UPLOAD_NAME, mimeType: 'image/png', buffer: makePng(96, 96, [0x33, 0x66, 0xcc]) };
const UPLOAD_MD = {
  name: 'accept-probe-sweep.md',
  mimeType: 'text/markdown',
  buffer: Buffer.from('# accept-probe-sweep\n\n自动化验收用的探针角色。\n', 'utf8'),
};
let uploadHits = 0;

const BASE = process.env.BASE || 'http://127.0.0.1:19096';
const OUT = process.env.SWEEP_DIR || path.join('D:\\ch\\project', '.ui-click-sweep-collect');
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv.slice(2);

const ROUTES = [
  { path: '/collect/dashboard', name: 'Dashboard', settle: 9000 },
  { path: '/collect/collector', name: 'Collector', settle: 12000 },
  { path: '/collect/run', name: 'RunRecords', settle: 12000 },
  { path: '/collect/record', name: 'CollectRecords', settle: 12000 },
  { path: '/collect/datasource/list', name: 'DataSource', settle: 12000 },
  { path: '/collect/job-overview', name: 'JobOverview', settle: 9000 },
  { path: '/collect/job', name: 'JobWorkbench', settle: 12000 },
  { path: '/collect/remote-node', name: 'RemoteNode', settle: 9000 },
  { path: '/collect/job-log', name: 'JobLog', settle: 9000 },
];

const SKIP_NAME = /退出登录|登出|logout|sign\s*out|注销账号|删除账号/i;
const NOISE = /weather|typhoon|location|favicon|\.map$|sourcemap/i;

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

const COLLECT = `(() => {
  const sel = ${JSON.stringify(CLICKABLE_SEL)};
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
    || /is-disabled|disabled/.test(String(el.className));

  for (const old of document.querySelectorAll('[data-sweep-id]')) old.removeAttribute('data-sweep-id');

  const baseSet = new Set(document.querySelectorAll(sel));
  const plan = [];
  for (const el of baseSet) plan.push({ el, kind: 'base' });

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
    const cls = clsOf(el).slice(0, 80);
    const fp = el.tagName.toLowerCase() + '|' + cls + '|' + name;
    const ord = seenFp.get(fp) || 0;
    seenFp.set(fp, ord + 1);
    const top = r.width && r.height ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
    out.push({
      id, name, visible, disabled, ord, cls,
      tag: el.tagName.toLowerCase(),
      w: Math.round(r.width), h: Math.round(r.height),
      inChrome: !!el.closest('.global-sidebar, .custom-titlebar'),
      occluded: !!(top && top !== el && !el.contains(top) && !top.contains(el)),
      extra: p.kind === 'ptr',
    });
  }
  return out;
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function resetPersistedUiState(p) {
  try {
    await p.evaluate(() => {
      localStorage.setItem('sidebarVisible', 'true');
      localStorage.removeItem('sessionGroupExpanded');
    });
  } catch { /* ignore */ }
}

async function onLoginPage(p) {
  try {
    return /\/login/.test(new URL(p.url()).pathname);
  } catch {
    return false;
  }
}

async function login(p) {
  for (let i = 0; i < 4; i++) {
    try {
      await p.goto(BASE + '/#/collect/run', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await p.waitForFunction("document.querySelectorAll('input').length >= 2 || document.querySelector('.el-menu') !== null", { timeout: 40000 });
      await sleep(1200);
      if (await p.locator('input').count() >= 2) {
        await p.locator('input').nth(0).fill(process.env.USER_NAME || 'sa');
        await p.locator('input').nth(1).fill(process.env.USER_PASS || '123456');
        await p.locator('button').first().click();
        await p.waitForFunction("document.querySelector('.el-menu') !== null || document.querySelector('.el-table') !== null", { timeout: 30000 });
        return true;
      }
      await sleep(1500);
      if (!(await onLoginPage(p))) return true;
    } catch (e) {
      console.log('  login retry ' + (i + 1) + ': ' + String(e.message).split('\n')[0].slice(0, 120));
      await sleep(2000);
    }
  }
  return false;
}

async function discover(p) {
  return {};
}

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

  let bucket = { pageErrors: [], consoleErrors: [], failed: [] };
  const netLog = [];
  const events = [];
  let browser = null;
  let page = null;
  let pageCrashed = false;
  let crashes = 0;
  let d = {};

  const attach = (p) => {
    p.on('pageerror', (e) => bucket.pageErrors.push(String(e.message).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error') bucket.consoleErrors.push(m.text().slice(0, 200)); });
    p.on('response', (r) => {
      if (r.status() >= 400) netLog.push({ status: r.status(), url: r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 120) });
    });
    p.on('requestfailed', (r) => {
      const u = r.url().replace(BASE, '').replace(/^https?:\/\/[^/]+/, '');
      const reason = (r.failure() && r.failure().errorText) || '';
      if (/ERR_ABORTED/i.test(reason)) return;
      if (!NOISE.test(u)) bucket.failed.push(r.method() + ' ' + u.slice(0, 120) + ' [' + reason + ']');
    });
    p.on('dialog', (x) => x.dismiss().catch(() => {}));
    p.on('filechooser', async (fc) => {
      let accept = '';
      try {
        const el = await fc.element();
        accept = (await el.getAttribute('accept')) || '';
      } catch { /* ignore */ }
      const a = accept.toLowerCase();
      const wantsImage = !a || /image\/|\.png|\.jpe?g|\.webp|\.gif|\.bmp/.test(a);
      const wantsText = /\.md|markdown|\.json|text\/|application\/json/.test(a);
      if (wantsImage) {
        uploadHits++;
        fc.setFiles(UPLOAD_FILE).catch(() => {});
      } else if (wantsText) {
        uploadHits++;
        fc.setFiles(UPLOAD_MD).catch(() => {});
      }
    });
    p.on('crash', () => { pageCrashed = true; events.push({ ev: 'page-crash', at: new Date().toISOString() }); });
    p.on('close', () => events.push({ ev: 'page-close', at: new Date().toISOString() }));
  };

  const boot = async () => {
    browser = await chromium.launch({ headless: true });
    browser.on('disconnected', () => events.push({ ev: 'browser-disconnected', at: new Date().toISOString() }));
    page = await (await browser.newContext({ viewport: { width: 1512, height: 950 } })).newPage();
    pageCrashed = false;
    attach(page);
  };

  const isDead = () => pageCrashed || !page || page.isClosed() || !browser || !browser.isConnected();
  const summary = { crashes: 0, aborted: false };

  const onSurvivableCrash = (kind) => (e) => {
    const msg = String((e && e.message) || e).slice(0, 200);
    events.push({ ev: kind, err: msg, at: new Date().toISOString() });
    if (/Target crashed|Target page, context or browser has been closed|browser has been closed|crash/i.test(msg)) {
      console.log('  [' + kind + '] 浏览器崩溃穿透到进程层，交给自愈续跑: ' + msg.slice(0, 120));
      return;
    }
    console.log('  [' + kind + '] 未知异常（记入 events，继续跑）: ' + msg.slice(0, 160));
  };
  process.on('uncaughtException', onSurvivableCrash('uncaughtException'));
  process.on('unhandledRejection', onSurvivableCrash('unhandledRejection'));

  const report = { base: BASE, startedAt: new Date().toISOString(), routes: [] };
  let pass = 0, fail = 0, warn = 0;
  const chromeSeen = new Set();
  let chromeDone = false;

  await boot();
  if (!(await login(page))) {
    console.log('LOGIN FAIL');
    await browser.close().catch(() => {});
    process.exit(3);
  }
  d = await discover(page);
  console.log('LOGIN OK');

  const recover = async (why) => {
    crashes++;
    summary.crashes = crashes;
    events.push({ ev: 'recover', why, at: new Date().toISOString() });
    console.log('  [recover] 浏览器/页面已失效（' + why + '），重建会话（第 ' + crashes + ' 次）');
    try { await browser.close(); } catch { /* ignore */ }
    try {
      await boot();
      RAW_TOKEN = '';
      if (!(await login(page))) return false;
      d = await discover(page);
      return true;
    } catch (e) {
      events.push({ ev: 'recover-failed', err: String(e.message).slice(0, 160), at: new Date().toISOString() });
      return false;
    }
  };

  const targets = ROUTES.filter((r) => !ONLY.length || ONLY.some((o) => r.path.includes(o) || r.name.includes(o)));

  for (const route of targets) {
    if (isDead()) {
      if (!(await recover('路由 ' + route.path + ' 开跑前发现 page/browser 已关闭'))) {
        summary.aborted = true;
        console.log('ABORT: 会话重建失败，终止遍历');
        break;
      }
    }
    const url = route.path;
    const R = {
      route: route.path, name: route.name, url,
      total: 0, elements: [], pageErrors: [], consoleErrors: [], failed: [],
      net5xx: [], notes: [],
    };
    bucket = { pageErrors: [], consoleErrors: [], failed: [] };
    netLog.length = 0;

    let gotoOk = true;
    try {
      {
        const connRe = /net::ERR_|ECONNREFUSED|ECONNRESET|socket hang up|Target closed|Connection refused/i;
        let lastErr = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
            if (!connRe.test(String((e && e.message) || e))) throw e;
            if (attempt < 3) {
              console.log('  [wait-server] ' + route.path + ' 连接失败（第 ' + (attempt + 1) + ' 次），等 30s 后重试');
              await sleep(30000);
            }
          }
        }
        if (lastErr) throw lastErr;
      }
      await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
      await sleep(1500);
      for (let attempt = 0; attempt < 2 && (await onLoginPage(page)); attempt++) {
        console.log('  [relogin] ' + route.path + ' 被守卫弹到登录页，重登后重进（第 ' + (attempt + 1) + ' 次）');
        if (!(await login(page))) {
          R.notes.push('掉登录后重登失败');
          gotoOk = false;
          break;
        }
        await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
        await sleep(1500);
      }
      if (gotoOk && (await onLoginPage(page))) {
        R.notes.push('重登后仍停留在登录页，该路由未采集');
        gotoOk = false;
      }
      const deadline = Date.now() + route.settle;
      const hardCap = deadline + 60000;
      for (;;) {
        let n = 0;
        let loading = false;
        try {
          const st = await page.evaluate(() => ({
            n: [...document.querySelectorAll('button,[role="button"]')]
              .filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2; }).length,
            loading: document.readyState !== 'complete',
          }));
          n = st.n;
          loading = st.loading;
        } catch { break; }
        if ((n > 0 && (!loading || Date.now() > deadline)) || Date.now() > hardCap) break;
        await sleep(1000);
      }
      try {
        for (let i = 0; i < 6; i++) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await sleep(600);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(800);
      } catch { /* ignore */ }
    } catch (e) {
      gotoOk = false;
      R.notes.push('打开页面失败: ' + String(e.message).slice(0, 120));
      if (isDead() && (await recover('goto 失败且 page/browser 已关闭: ' + route.path))) {
        try {
          await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
          await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
          await sleep(1500);
          gotoOk = !(await onLoginPage(page));
          if (!gotoOk) R.notes.push('崩溃重建后重登仍落在登录页');
          else R.notes.push('浏览器崩溃已自愈并重跑本路由（第 ' + crashes + ' 次）');
        } catch (e2) {
          R.notes.push('崩溃重建后仍打不开: ' + String(e2.message).slice(0, 120));
        }
      }
    }

    if (gotoOk) {
      const loadErrs = [...bucket.pageErrors];
      const loadCerr = bucket.consoleErrors.filter(
        (t) => !NOISE.test(t) && !/Failed to load resource/i.test(t),
      );
      const loadFailed = [...bucket.failed];
      const load5xx = netLog.filter((n) => n.status >= 500 && !NOISE.test(n.url));

      let items = [];
      try {
        items = await page.evaluate(COLLECT);
      } catch (e) {
        R.notes.push('收集可点元素失败: ' + String(e.message).slice(0, 120));
      }
      R.total = items.length;

      if (gotoOk && items.length === 0) {
        R.notes.push('首轮采集为 0（疑似页面未就绪），补等一轮再采集');
        const retryDeadline = Date.now() + Math.max(route.settle, 20000);
        for (;;) {
          let n = 0;
          try {
            n = await page.evaluate(() => [...document.querySelectorAll('button,[role="button"]')]
              .filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2; }).length);
          } catch { break; }
          if (n > 0 || Date.now() > retryDeadline) break;
          await sleep(1000);
        }
        try {
          const again = await page.evaluate(COLLECT);
          if (again.length > 0) {
            items = again;
            R.total = items.length;
          }
        } catch (e) {
          R.notes.push('补采失败: ' + String(e.message).slice(0, 120));
        }
      }

      const nameless = items.filter((i) => i.visible && !i.name);
      const collapsed = items.filter((i) => i.visible && (i.w < 8 || i.h < 8));

      if (process.env.COLLECT_ONLY) {
        const vis = items.filter((i) => i.visible);
        const ex = items.filter((i) => i.extra);
        console.log('  [' + R.name + '] total=' + items.length + ' visible=' + vis.length
          + ' extra=' + ex.length + ' extraVisible=' + ex.filter((i) => i.visible).length
          + ' noName=' + vis.filter((i) => !i.name).length
          + ' notes=' + JSON.stringify(R.notes));
        report.routes.push(R);
        fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
        continue;
      }

      for (const it of items) {
        const label = it.name || '(无名)' + ' [' + it.cls.slice(0, 30) + ']';
        const rec = { name: label, cls: it.cls, tag: it.tag, extra: !!it.extra, state: 'ok', effect: '', err: '' };

        if (!it.visible) { rec.state = 'hidden'; R.elements.push(rec); continue; }
        if (!it.name) rec.noName = true;
        if (SKIP_NAME.test(it.name)) { rec.state = 'skipped'; R.elements.push(rec); continue; }
        if (it.disabled) { rec.state = 'disabled'; R.elements.push(rec); continue; }
        if (it.inChrome) {
          const k = it.tag + '|' + it.cls + '|' + it.name;
          if (chromeSeen.has(k)) { rec.state = 'dup-chrome'; R.elements.push(rec); continue; }
          chromeSeen.add(k);
          if (chromeDone) { rec.state = 'dup-chrome'; R.elements.push(rec); continue; }
        }

        bucket = { pageErrors: [], consoleErrors: [], failed: [] };
        netLog.length = 0;

        if (isDead()) {
          if (!(await recover('点击期间 page/browser 已关闭: ' + label))) {
            rec.state = 'not-clickable';
            rec.err = '会话崩溃且重建失败，本路由终止';
            fail++;
            R.elements.push(rec);
            summary.aborted = true;
            break;
          }
          try {
            await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
            await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
            await sleep(Math.min(route.settle, 6000));
          } catch { /* ignore */ }
          R.notes.push('崩溃自愈第 ' + crashes + ' 次（点「' + label + '」时），已重建会话续跑');
        }

        const fp = it.tag + '|' + it.cls + '|' + it.name;
        const findByFingerprint = async () => {
          const fresh = await page.evaluate(COLLECT);
          const same = fresh.filter((x) => x.tag + '|' + x.cls + '|' + x.name === fp);
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
        } catch { /* ignore */ }
        let renavigated = false;
        if (!target) {
          try {
            await resetPersistedUiState(page);
            await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
            await sleep(Math.min(route.settle, 6000));
            target = await findByFingerprint();
            renavigated = !!target;
          } catch { /* ignore */ }
        }
        rec.fresh = freshCount;
        rec.renavigated = renavigated;
        const urlBefore = page.url();
        const beforeOverlays = await page.evaluate(COUNT_OVERLAYS).catch(() => 0);
        await page.evaluate(START_MUT).catch(() => {});
        const uploadBefore = uploadHits;

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
            if (/outside of the viewport/i.test(String(e1.message))) {
              try {
                await resetPersistedUiState(page);
                await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
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
              try {
                await page.locator(sel).first().click({ timeout: 5000, force: true, noWaitAfter: true });
                forced = true;
              } catch (e2) {
                if (isDead() && (await recover('click 时 page/browser 已关闭: ' + label))) {
                  try {
                    await page.goto(BASE + '/#' + url, { waitUntil: 'domcontentloaded', timeout: 180000 });
                    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
                    await sleep(Math.min(route.settle, 6000));
                    const back = await findByFingerprint();
                    if (back) {
                      target = back;
                      rec.renavigated = renavigated = true;
                      R.notes.push('崩溃自愈第 ' + crashes + ' 次（点「' + label + '」时），已重建会话并重试该元素');
                      await page.locator('[data-sweep-id="' + back.id + '"]').first().click({ timeout: 8000, noWaitAfter: true });
                      clicked = true;
                    } else {
                      clicked = false;
                      clickErr = '崩溃重建后目标未找回';
                    }
                  } catch (e3) {
                    clicked = false;
                    clickErr = '崩溃重建后仍点不动: ' + String(e3.message).split('\n')[0].slice(0, 160);
                  }
                } else {
                  clicked = false;
                  const raw = String(e2.message).split('\n').map((x) => x.trim()).filter(Boolean);
                  const why = raw.filter((x) => /not stable|intercepts|outside of the viewport|not visible|not enabled|is disabled|detached|resolved to|strict mode violation/i.test(x));
                  clickErr = (why.length ? why : raw.slice(0, 2)).slice(0, 3).join(' / ').slice(0, 260);
                }
              }
            }
          }
        }
        for (let w = 0; w < 8 && uploadHits === uploadBefore; w++) await sleep(100);
        const uploaded = uploadHits > uploadBefore;
        await sleep(uploaded ? 2600 : 1100);

        const toasts = await page.locator('.el-message, .re-toast, .el-notification').allInnerTexts().catch(() => []);
        const overlays = await page.evaluate(COUNT_OVERLAYS).catch(() => 0);
        const muts = await page.evaluate(READ_MUT).catch(() => 0);
        const errs = [
          ...bucket.pageErrors,
          ...bucket.consoleErrors.filter((t) => !NOISE.test(t) && !/Failed to load resource/i.test(t)),
        ];
        const err5xx = netLog.filter((n) => n.status >= 500 && !NOISE.test(n.url));
        const err4xx = netLog.filter((n) => n.status >= 400 && n.status < 500 && !NOISE.test(n.url));
        const failedReq = [...bucket.failed];

        rec.effect = '接口' + netLog.length + '次 toast' + toasts.length + ' 弹窗' + overlays
          + ' DOM变更' + muts + '条' + (uploaded ? ' 已上传探针图' : '');
        if (uploaded) rec.upload = true;
        rec.before = beforeOverlays;
        rec.forced = !!forced;
        if (clickErr) rec.clickErr = clickErr;
        rec.urlChanged = page.url() !== urlBefore;
        if (rec.urlChanged) rec.afterUrl = page.url().replace(BASE, '');
        if (errs.length) rec.err = errs.join(' | ').slice(0, 200);
        if (err5xx.length) rec.err = (rec.err ? rec.err + ' | ' : '') + '5xx:' + err5xx.map((x) => x.status + ' ' + x.url).join(',').slice(0, 160);
        if (err4xx.length) rec.err4xx = err4xx.map((x) => x.status + ' ' + x.url).join(',').slice(0, 200);
        if (failedReq.length) rec.err = (rec.err ? rec.err + ' | ' : '') + '请求失败:' + failedReq.join(',').slice(0, 160);

        if (!clicked) {
          const invisible = /not visible/i.test(clickErr);
          rec.state = target ? (invisible ? 'state-dependent' : 'not-clickable') : 'vanished';
          rec.err = rec.err || clickErr;
        } else if (rec.err) {
          rec.state = 'click-error';
        } else if (netLog.length === 0 && toasts.length === 0
          && overlays <= beforeOverlays && muts === 0 && !rec.urlChanged && !uploaded) {
          rec.state = 'no-effect';
        } else if (forced) {
          rec.state = 'needs-force';
        }

        if (rec.state === 'click-error' || rec.state === 'not-clickable') fail++;
        else if (rec.state === 'no-effect' || rec.state === 'needs-force'
          || rec.state === 'vanished' || rec.state === 'state-dependent') warn++;
        else pass++;

        if (overlays > 0) await closeOverlays(page);
        if (await page.evaluate(COUNT_OVERLAYS).catch(() => 0) > 0) {
          await page.keyboard.press('Escape').catch(() => {});
          await sleep(500);
        }
        R.elements.push(rec);
      }

      if (nameless.length) R.notes.push('无名可点元素 ' + nameless.length + ' 个: ' + nameless.map((i) => i.cls.slice(0, 24)).join(' | ').slice(0, 220));
      chromeDone = true;
      if (collapsed.length) R.notes.push('尺寸塌陷 ' + collapsed.length + ' 个: ' + collapsed.map((i) => (i.name || i.cls.slice(0, 18)) + '(' + i.w + 'x' + i.h + ')').join(', ').slice(0, 200));
      R.pageErrors = loadErrs;
      R.consoleErrors = loadCerr;
      R.failed = loadFailed;
      R.net5xx = load5xx;
      R.net4xx = netLog.filter((n) => n.status >= 400 && n.status < 500 && !NOISE.test(n.url));
    }

    report.routes.push(R);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    const bad = R.elements.filter((e) => e.state === 'click-error' || e.state === 'not-clickable');
    const noeff = R.elements.filter((e) => e.state === 'no-effect');
    console.log(
      '  [' + R.name + '] 可点 ' + R.total + ' 个  异常 ' + bad.length + '  无副作用 ' + noeff.length
      + (bad.length ? '  -> ' + bad.slice(0, 4).map((e) => e.name + '(' + e.state + ')').join(', ') : '')
      + (R.pageErrors.length ? '  加载期pageerror:' + R.pageErrors.length : '')
      + (R.notes.length ? '  备注:' + R.notes.length : ''),
    );
  }

  const all = report.routes.flatMap((r) => r.elements.map((e) => ({ ...e, route: r.name })));
  const byState = {};
  for (const e of all) byState[e.state] = (byState[e.state] || 0) + 1;
  const emptyRoutes = report.routes.filter((r) => r.total === 0);
  const skippedRoutes = targets.filter((t) => !report.routes.some((r) => r.route === t.path));
  report.summary = {
    total: all.length, byState,
    pass, fail: fail + emptyRoutes.length, warn,
    crashes, aborted: summary.aborted, events,
    uploadHits,
    uploaded: all.filter((e) => e.upload).map((e) => ({ route: e.route, name: e.name })),
    emptyRoutes: emptyRoutes.map((r) => ({ name: r.name, notes: r.notes })),
    skippedRoutes: skippedRoutes.map((r) => r.name),
    clickError: all.filter((e) => e.state === 'click-error'),
    notClickable: all.filter((e) => e.state === 'not-clickable'),
    noEffect: all.filter((e) => e.state === 'no-effect'),
    needsForce: all.filter((e) => e.state === 'needs-force'),
    vanished: all.filter((e) => e.state === 'vanished'),
    stateDependent: all.filter((e) => e.state === 'state-dependent'),
    noAccessibleName: all.filter((e) => e.noName || e.state === 'no-accessible-name'),
    routeLoadErrors: report.routes.filter((r) => r.pageErrors.length || r.consoleErrors.length || r.net5xx.length),
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log('\n===== 遍历汇总 =====');
  console.log('  可点元素总数=' + all.length + '  ' + JSON.stringify(byState));
  console.log('  PASS=' + report.summary.pass + ' FAIL=' + report.summary.fail + ' WARN=' + warn);
  console.log('  可点但无 accessible name（已照常点击，仅无障碍观察）='
    + report.summary.noAccessibleName.length);
  console.log('  崩溃自愈=' + crashes + '  中止=' + summary.aborted + '  空采集路由=' + emptyRoutes.length
    + '  未跑到路由=' + skippedRoutes.length);
  console.log('  上传探针图命中=' + uploadHits + ' 次（filechooser 被真实满足）');
  if (emptyRoutes.length) {
    console.log('----- 空采集路由（0 可点 = 该路由未被有效验收，按 FAIL 计）-----');
    for (const r of emptyRoutes) console.log('  [' + r.name + '] notes=' + JSON.stringify(r.notes).slice(0, 200));
  }
  if (skippedRoutes.length) console.log('----- 未跑到的路由: ' + skippedRoutes.map((r) => r.name).join(', '));
  if (events.length) console.log('----- 会话事件: ' + JSON.stringify(events).slice(0, 400));
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
  const complete = !summary.aborted && emptyRoutes.length === 0 && skippedRoutes.length === 0;
  if (!complete) console.log('INCOMPLETE: 崩溃中止=' + summary.aborted + ' 空路由=' + emptyRoutes.length + ' 漏跑=' + skippedRoutes.length);
  process.exit(report.summary.fail === 0 && complete ? 0 : 3);
})().catch((e) => {
  console.error('FATAL: ' + e.message + '\n' + (e.stack || '').slice(0, 400));
  process.exit(3);
});