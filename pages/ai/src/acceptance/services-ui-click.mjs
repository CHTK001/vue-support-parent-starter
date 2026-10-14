// /setting/services 定点可点击验收：每个可见按钮/图标/下拉/开关都真正点一次。
// 危险操作（删除/停止）只验收入口与确认弹窗，不实际提交；启动后会补一次停止恢复。
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:15689'
const OUT_DIR = process.env.SWEEP_DIR || path.join(process.cwd(), '.services-ui-click')
fs.mkdirSync(OUT_DIR, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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
  '.el-switch__core',
  '.el-select__wrapper',
  '.svc-switch',
].join(',')

const COLLECT = `(() => {
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
    || /is-disabled|disabled/.test(String(clsOf(el)));
  for (const old of document.querySelectorAll('[data-ui-click-id]')) old.removeAttribute('data-ui-click-id');
  const baseSet = new Set(document.querySelectorAll(${JSON.stringify(CLICKABLE_SEL)}));
  const plan = [];
  for (const el of baseSet) plan.push({ el, kind: 'base' });
  const ptrSel = 'label,div,span,li,td,th';
  for (const el of document.querySelectorAll(ptrSel)) {
    if (baseSet.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.cursor !== 'pointer') continue;
    const p = el.parentElement;
    if (p && getComputedStyle(p).cursor === 'pointer') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.width * r.height > innerWidth * innerHeight * 0.45) continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    plan.push({ el, kind: 'ptr' });
  }
  const out = [];
  const seen = new Map();
  for (let i = 0; i < plan.length; i++) {
    const el = plan[i].el;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const visible = r.width >= 2 && r.height >= 2
      && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
    const disabled = disOf(el);
    const name = nameOf(el);
    const cls = clsOf(el).slice(0, 80);
    const fp = el.tagName.toLowerCase() + '|' + cls + '|' + name;
    const ord = seen.get(fp) || 0;
    seen.set(fp, ord + 1);
    if (!visible) continue;
    el.setAttribute('data-ui-click-id', 'uic' + i);
    out.push({ id: 'uic' + i, name, disabled, ord, cls, tag: el.tagName.toLowerCase(), fp });
  }
  return out;
})()`

const COUNT_OVERLAY = `(() => {
  const vis = (els) => [...els].filter((e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width >= 2 && r.height >= 2 && s.display !== 'none' && s.visibility !== 'hidden';
  });
  return vis(document.querySelectorAll('.el-overlay,[class*="overlay"],[class*="dialog"],[class*="popover"],[class*="dropdown"]')).length;
})()`

const READ_EFFECT = `(() => {
  const vis = (els) => [...els].filter((e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width >= 2 && r.height >= 2 && s.display !== 'none' && s.visibility !== 'hidden';
  });
  return {
    url: location.href,
    overlays: vis(document.querySelectorAll('.el-overlay,[class*="overlay"],[class*="dialog"],[class*="popover"],[class*="dropdown"]')).length,
    toasts: vis(document.querySelectorAll('.el-message,.el-message-box')).map((e) => (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90)),
    mutations: window.__svcMutCount || 0,
  };
})()`

async function login(page) {
  for (let i = 0; i < 4; i++) {
    try {
      await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 90000 })
      await page.waitForSelector('input[type="password"]', { timeout: 40000 })
      await page.waitForTimeout(1200)
      await page.locator('input[type="text"]').first().fill('admin')
      await page.locator('input[type="password"]').first().fill('admin123')
      await page.locator('button:has-text("登")').first().click()
      try {
        await page.waitForURL((x) => !/\/login/.test(new URL(x).pathname), { timeout: 25000 })
      } catch { /* 以 URL/页面内容兜底 */ }
      await page.waitForTimeout(1500)
      const url = page.url()
      if (!/\/login/.test(new URL(url).pathname)) return true
    } catch (e) {
      console.log('login retry ' + (i + 1) + ': ' + String(e.message).split('\n')[0].slice(0, 140))
    }
  }
  return false
}

async function openServices(page) {
  await page.goto(BASE + '/setting/services', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(3000)
  const present = await page.evaluate(() => !!document.querySelector('.svc')).catch(() => false)
  if (!present) {
    const dbg = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      body: (document.body.innerText || '').slice(0, 140),
      hasSvc: !!document.querySelector('.svc'),
    })).catch(() => ({}))
    console.log('DEBUG openServices missing .svc: ' + JSON.stringify(dbg))
  }
  try {
    await page.waitForFunction(() => !!document.querySelector('.svc'), null, { timeout: 15000 })
  } catch (e) {
    console.log('DEBUG earlyErrs=' + JSON.stringify(earlyErrs.slice(-10)))
    throw e
  }
  await page.waitForTimeout(2500)
}

async function armMutation(page) {
  await page.evaluate(() => {
    window.__svcMutCount = 0
    if (window.__svcObs) { try { window.__svcObs.disconnect() } catch {} }
    window.__svcObs = new MutationObserver(() => { window.__svcMutCount++ })
    window.__svcObs.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
  })
}

async function launchBrowser() {
  let lastErr
  for (let i = 0; i < 3; i++) {
    try {
      return await chromium.launch({ headless: true })
    } catch (e) {
      lastErr = e
      await sleep(2500)
    }
  }
  throw lastErr
}

const browser = await launchBrowser()
const page = await (await browser.newContext({ viewport: { width: 1512, height: 950 }, deviceScaleFactor: 1 })).newPage()
let dialogCount = 0
let clickStart = 0
const clickNet = []
const earlyErrs = []
page.on('console', (m) => { if (m.type() === 'error') earlyErrs.push('[console] ' + m.text().slice(0, 160)) })
page.on('pageerror', (e) => earlyErrs.push('[pageerror] ' + String(e.message).slice(0, 160)))
page.on('dialog', async (d) => { dialogCount++; await d.dismiss().catch(() => {}) })
page.on('response', (r) => {
  if (Date.now() >= clickStart && r.status() >= 400) clickNet.push(r.status() + ' ' + r.url().slice(-110))
})
page.on('pageerror', (e) => { if (Date.now() >= clickStart) clickNet.push('PAGEERROR ' + String(e.message).slice(0, 120)) })

await login(page)
await openServices(page)
const original = await page.evaluate(COLLECT)
const results = []

for (const item of original) {
  if (/退出登录|登出|注销账号/i.test(item.name)) continue
  await openServices(page)
  if (!(await page.locator('.svc').count())) { results.push({ ...item, state: 'route-error', err: '服务配置未渲染' }); continue }
  const fresh = await page.evaluate(COLLECT)
  const same = fresh.filter((x) => x.fp === item.fp)
  const target = same[Math.min(item.ord, same.length - 1)]
  if (!target) { results.push({ ...item, state: 'vanished', err: '重新进入后本控件不存在' }); continue }
  if (target.disabled) { results.push({ ...item, state: 'disabled' }); continue }
  await armMutation(page)
  const overlaysBefore = await page.evaluate(COUNT_OVERLAY)
  const urlBefore = page.url()
  clickStart = Date.now()
  clickNet.length = 0
  const dlgBefore = dialogCount
  let clickErr = ''
  let forced = false
  try {
    await page.locator('[data-ui-click-id="' + target.id + '"]').first().click({ timeout: 5000, noWaitAfter: true })
  } catch (e1) {
    try {
      await page.locator('[data-ui-click-id="' + target.id + '"]').first().click({ timeout: 5000, force: true, noWaitAfter: true })
      forced = true
    } catch (e2) {
      clickErr = String(e2.message).split('\n').filter((x) => x.trim()).filter((x) => /not stable|intercepts|outside of the viewport|not visible|detached|timeout/i.test(x)).slice(0, 2).join(' / ').slice(0, 220) || 'click timeout'
    }
  }
  await sleep(900)
  const effect = await page.evaluate(READ_EFFECT).catch(() => ({ url: '', overlays: 0, toasts: [], mutations: 0 }))
  const openedOverlay = effect.overlays > overlaysBefore
  const urlChanged = effect.url !== urlBefore
  const toasts = effect.toasts
  const mutations = effect.mutations
  const net = [...clickNet]
  const dlgSeen = dialogCount > dlgBefore
  let state = 'ok'
  if (clickErr) state = !forced ? 'not-clickable' : 'forced-ok'
  else if (!urlChanged && !openedOverlay && !dlgSeen && !toasts.length && mutations === 0 && !net.length) {
    state = /全部|INFO\+|WARN\+|ERROR\+|自动|3 秒|5 秒|10 秒|30 秒|标准输出|最近 200 行/.test(item.name) ? 'state-dependent' : 'no-effect'
  }
  if (openedOverlay || dlgSeen) { try { await page.keyboard.press('Escape'); await page.waitForTimeout(300) } catch {} }
  results.push({
    name: item.name,
    cls: item.cls,
    tag: item.tag,
    state,
    forced,
    effect: `接口${net.filter((x) => !x.startsWith('PAGEERROR')).length}次 toast${toasts.length} 弹窗${openedOverlay ? 1 : 0} DOM变更${mutations}条 URL${urlChanged ? '变更' : '不变'}`,
    err: clickErr || '',
    dialog: dlgSeen,
    toasts: toasts.slice(0, 2),
    net: net.slice(0, 3),
  })
}

// 启动按钮的恢复：若上面把实例启动了，在这里补一次停止，保持验收环境原状。
try {
  await openServices(page)
  const stopBtn = page.locator('button[aria-label="停止该实例"]')
  if (await stopBtn.count()) {
    await stopBtn.first().click({ timeout: 5000, noWaitAfter: true })
    await page.waitForTimeout(1200)
  }
} catch { /* 恢复失败仅记录环境提示 */ }

const summary = results.reduce((m, r) => { m[r.state] = (m[r.state] || 0) + 1; return m }, {})
summary.total = results.length
const report = { startedAt: new Date().toISOString(), route: '/setting/services', summary, results }
fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2))
console.log('TOTAL=' + summary.total + ' states=' + JSON.stringify(summary))
for (const r of results.filter((x) => x.state !== 'ok' && x.state !== 'disabled' && x.state !== 'state-dependent')) {
  console.log('  [' + (r.name || '(无名)') + '] -> ' + r.state + ' :: ' + (r.err || r.effect).slice(0, 160))
}
const failed = results.filter((x) => x.state === 'not-clickable' || x.state === 'click-error' || x.state === 'route-error')
console.log('FAIL=' + failed.length)
console.log('report=' + path.join(OUT_DIR, 'report.json'))
await browser.close()
process.exit(failed.length ? 1 : 0)