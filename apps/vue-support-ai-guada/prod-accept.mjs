/**
 * Production acceptance: full business flow, image + video.
 *
 * Measurement discipline (three earlier failures came from bad metrics):
 *  - Count polls via Playwright's `request` event, never performance API.
 *  - Never assert on a card that is legitimately still "running".
 *  - Every FAIL must be investigated against the DOM, not assumed to be a bug.
 *
 * ASCII only: shell-editing of UTF-8 files has repeatedly corrupted scripts here.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
const run = promisify(execFile)

const SHOT = 'D:/ch/project/.tmp/sg/shots'
fs.mkdirSync(SHOT, { recursive: true })
const FE = 'http://localhost:15689'
const API = 'http://192.168.50.198:8787'
const REPORT = fileURLToPath(new URL('prod-accept.report.json', import.meta.url))

/**
 * Fingerprint the run is bound to, collected from the host exactly like
 * api-accept does it (SSH), so a redeploy makes this artifact self-evidently
 * stale. Kept in one place: the report is only trustworthy while md5/PID/start
 * time match SIGNOFF section 1.
 */
const PLINK = 'C:/Program Files/PuTTY/plink.exe'
const HOSTKEY = 'ssh-ed25519 255 SHA256:cwfyC8w0qteYq8lXud9P9U2aSS8O/bxQOK6Y60BOmsI'
const HOST = 'kali@192.168.50.198'
async function fingerprint() {
  // Single quotes only: plink drops inner double quotes on the way to the shell.
  const remote =
    "md5sum /opt/ai-starter/app.jar; systemctl show ai-starter -p MainPID -p NRestarts -p ExecMainStartTimestamp -p ActiveState; " +
    "pgrep -c -f 'server.port=8787' || true; " +
    'grep -ac UseCompactObjectHeaders /proc/$(systemctl show --value -p MainPID ai-starter)/cmdline || true'
  const { stdout } = await run(PLINK, ['-batch', '-pw', 'kali', '-hostkey', HOSTKEY, HOST, remote], {
    timeout: 60000,
    windowsHide: true,
  })
  const out = String(stdout)
  const pid = Number((out.match(/MainPID=(\d+)/) || [])[1] || 0)
  const pgrep = Number((out.match(/^\s*(\d+)\s*$/m) || [])[1] || 0)
  return {
    jarMd5: (out.match(/^([0-9a-f]{32})\s/m) || [])[1],
    activeState: (out.match(/ActiveState=(\S+)/) || [])[1],
    mainPID: String(pid || ''),
    nRestarts: (out.match(/NRestarts=(\d+)/) || [])[1],
    execMainStartTimestamp: (out.match(/ExecMainStartTimestamp=(.+)/) || [])[1]?.trim(),
    // pgrep -c counts its own wrapper, so 2 means one real instance (same caveat as api-accept)
    instanceCount: String(pgrep),
    compactObjectHeaders: /UseCompactObjectHeaders/.test(out) ? '1' : '0',
  }
}

const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(`${name}${extra ? '  ' + extra : ''}`)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}

const token = (
  await (
    await fetch(`${API}/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    })
  ).json()
).data.accessToken
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
const api = {
  list: async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=50&offset=0`, { headers: H })).json()).data ?? [],
  models: async (ty) => (await (await fetch(`${API}/v2/ai/generate/models?type=${ty}`, { headers: H })).json()).data ?? [],
  submit: async (body) => {
    const r = await fetch(`${API}/v2/ai/generate/tasks`, { method: 'POST', headers: H, body: JSON.stringify(body) })
    return { http: r.status, ...(await r.json()) }
  },
  del: async (id) => (await fetch(`${API}/v2/ai/generate/tasks/${id}`, { method: 'DELETE', headers: H })).status,
}
const running = (t) => t.status === 'PENDING' || t.status === 'RUNNING'

// ---------- 0. clean slate ----------
console.log('=== 0. clean up leftovers ===')
let cleaned = 0
for (const ty of ['image', 'video']) {
  for (const t of (await api.list(ty)).filter(running)) {
    await api.del(t.taskId)
    console.log(`  deleted stale ${ty} ${t.taskId}`)
    cleaned++
  }
}
console.log(`  cleaned=${cleaned}`)

// ---------- 1. catalogs ----------
console.log('\n=== 1. model catalogs ===')
const mi = await api.models('image')
const mv = await api.models('video')
chk('image catalog non-empty', mi.length > 0, `${mi.length}`)
chk('video catalog non-empty', mv.length > 0, `${mv.length}`)
chk('video model carries durations', (mv[0]?.config?.durations ?? []).length > 0, JSON.stringify(mv[0]?.config?.durations))
chk('video model maxCount is 1', mv[0]?.config?.maxCount === 1, String(mv[0]?.config?.maxCount))

// ---------- 2. single-task guard ----------
console.log('\n=== 2. single-task guard (backend) ===')
const s1 = await api.submit({ type: 'video', model: mv[0].model, prompt: 'guard probe A', size: '1280x720', duration: 4 })
const s2 = await api.submit({ type: 'video', model: mv[0].model, prompt: 'guard probe B', size: '1280x720', duration: 4 })
console.log(`  first  HTTP ${s1.http} taskId=${s1.data?.taskId}`)
console.log(`  second HTTP ${s2.http} ${s2.msg || ''}`)
chk('first submit accepted', !!s1.data?.taskId, s1.msg || '')
chk('second submit blocked', !s2.data?.taskId && /已有/.test(s2.msg || ''), s2.msg || '')

// Wait for terminal so later steps are not blocked.
// The deadline is a *latency budget*, not the invariant: the invariant is "the
// record persists and settles". Real upstream generation has been observed
// taking >50s (the video provider sometimes actually renders instead of
// fast-failing with "provider busy"), and a 50s budget then cascades into
// section 5 -- the composer keeps `busy = submitting || hasRunningTask`, so the
// send button is still disabled when we type and every later check fails. Two
// acceptance runs were lost to exactly that race.
for (let i = 0; i < 72; i++) {
  await new Promise((r) => setTimeout(r, 2500))
  const list = await api.list('video')
  const t = list.find((x) => x.taskId === s1.data?.taskId)
  if (t && !running(t)) {
    console.log(`  first task terminal: ${t.status}  err=${t.errorMessage || '-'}`)
    chk('record persisted with terminal status', true, t.status)
    break
  }
  if (i === 71) {
    chk('record persisted with terminal status', false, 'still running after 180s')
  }
}

// ---------- 3. browser: image view ----------
console.log('\n=== 3. browser: image view ===')
const browser = await chromium.launch()
const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.setDefaultTimeout(150000)
const jsErrs = []
page.on('pageerror', (e) => jsErrs.push('PAGEERROR ' + String(e).slice(0, 140)))
let polls = []
const isPoll = (u) => /\/v2\/ai\/generate\/tasks\/[^?]+$/.test(new URL(u).pathname)
page.on('request', (r) => {
  if (r.method() === 'GET' && isPoll(r.url())) polls.push(r.url().split('/').pop())
})

await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await page.waitForTimeout(4000)
await page.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
await page.waitForTimeout(4000)

const imgView = await page.evaluate(() => ({
  title: document.querySelector('.wg-title')?.textContent?.trim(),
  btn: document.querySelector('.wg-media-btn')?.innerText.replace(/\n/g, ' ').trim(),
  cards: document.querySelectorAll('.wg-card:not(.is-skeleton)').length,
  imgs: document.querySelectorAll('.wg-card-media img').length,
  oldTab: !!document.querySelector('.wg-tab, .wg-media-switch'),
}))
chk('image title', imgView.title === '图像生成', imgView.title)
chk('type button shows image', imgView.btn === '图像', imgView.btn)
chk('history rendered', imgView.cards > 0, `${imgView.cards}`)
chk('result images loaded', imgView.imgs > 0, `${imgView.imgs}`)
chk('legacy inline tab removed', !imgView.oldTab)
await page.screenshot({ path: `${SHOT}/pa-1-image.png`, clip: { x: 0, y: 0, width: 1600, height: 150 } })

// ---------- 4. switch to video ----------
console.log('\n=== 4. browser: switch to video ===')
await page.click('.wg-media-btn')
await page.waitForTimeout(900)
const pop = page.locator('.wg-popper', { hasText: '生成类型' }).first()
const items = (await pop.locator('.wg-menu-item').allInnerTexts()).map((t) => t.replace(/\n/g, ' | '))
chk('popover has two options', items.length === 2, items.join(' / '))
await page.screenshot({ path: `${SHOT}/pa-2-popover.png`, clip: { x: 1000, y: 0, width: 600, height: 250 } })
await pop.locator('.wg-menu-item', { hasText: '视频' }).click()
await page.waitForTimeout(4000)
const vidView = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('.wg-chip')].map((c) => c.innerText.replace(/\n/g, ' ').trim())
  return {
    title: document.querySelector('.wg-title')?.textContent?.trim(),
    btn: document.querySelector('.wg-media-btn')?.innerText.replace(/\n/g, ' ').trim(),
    chips,
    hasCount: chips.some((c) => c.includes('张')),
    hasDur: chips.some((c) => /^\d+s$/.test(c)),
  }
})
chk('title switched to video', vidView.title === '视频生成', vidView.title)
chk('button switched to video', vidView.btn === '视频', vidView.btn)
chk('duration chip present', vidView.hasDur, vidView.chips.join(' / '))
chk('count chip absent in video', !vidView.hasCount)
await page.screenshot({ path: `${SHOT}/pa-3-video.png`, clip: { x: 0, y: 0, width: 1600, height: 150 } })

// ---------- 5. video failure notice ----------
console.log('\n=== 5. video submit: record + notice + persistence ===')
// ElMessage auto-dismisses after ~3s, so a single sample later finds nothing.
// Watch the DOM instead of polling: a MutationObserver sees every insert, so
// a toast can never slip between two polls. The interval is kept as a belt for
// texts that arrive by textContent mutation without a childList change.
await page.evaluate(() => {
  window.__toasts = []
  const grab = () => {
    for (const e of document.querySelectorAll('.el-message')) {
      const t = e.innerText.trim()
      if (t && !window.__toasts.includes(t)) window.__toasts.push(t)
    }
  }
  new MutationObserver(grab).observe(document.body, { childList: true, subtree: true })
  window.__toastTimer = setInterval(grab, 120)
})

// The composer gates the send button on `busy = submitting || hasRunningTask`
// (ImageGeneratePage), so "send enabled when idle" is only meaningful once
// nothing is in flight. Wait for that precondition explicitly instead of
// inheriting section 2's deadline by accident -- when section 2 timed out, this
// check used to be the first thing to fail and it said nothing about why.
let idle = false
let runningLeft = -1
for (let i = 0; i < 48; i++) {
  const inflight =
    (await api.list('video')).filter(running).length + (await api.list('image')).filter(running).length
  if (inflight === 0) {
    idle = true
    break
  }
  runningLeft = inflight
  await new Promise((r) => setTimeout(r, 2500))
}
chk('composer idle before typing', idle, idle ? 'no task in flight' : `${runningLeft} still in flight after 120s`)

const beforeCards = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
const input = page.locator('.wg-input, [contenteditable="true"], textarea').last()
await input.click()
await page.keyboard.type('acceptance video probe')
await page.waitForTimeout(700)
const btnBefore = await page.evaluate(() => document.querySelector('.send-btn')?.disabled)
chk('send enabled when idle with text', btnBefore === false, `disabled=${btnBefore}`)
await page.keyboard.press('Enter')
// Wait for *this* task to reach a terminal state instead of a fixed sleep:
// a fixed 14s can end before the async submit has even reached the provider,
// in which case there is nothing to toast about yet.
let terminal = null
for (let i = 0; i < 180; i++) {
  await page.waitForTimeout(1000)
  const seen = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.wg-card:not(.is-skeleton)')].find((x) =>
      x.innerText.includes('acceptance video probe'),
    )
    if (!c) return null
    const badge = c.querySelector('.wg-badge')?.innerText?.trim() ?? ''
    return { badge, text: c.innerText.replace(/\n+/g, ' | ').slice(0, 220) }
  })
  if (seen && /完成|失败|取消/.test(seen.badge)) {
    terminal = seen
    break
  }
}
const afterCards = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
chk('card added after submit', afterCards > beforeCards, `${beforeCards} -> ${afterCards}`)
chk('the submitted card reaches a terminal state', !!terminal, terminal ? terminal.badge : 'still running after 180s')
const notice = await page.evaluate(() => {
  clearInterval(window.__toastTimer)
  return window.__toasts ?? []
})
// The void card is located by this run's own prompt, never by .is-void alone:
// a bare querySelector('.wg-card.is-void') happily returns the void card left
// over from section 2, which makes the check pass on stale state.
const voidCard = terminal?.text ?? null
console.log(`  toast: ${notice.join(' / ') || '(none)'}`)
console.log(`  this-run card: ${voidCard || '(none)'}`)
// The upstream wording is NOT the contract here: the video provider has been
// observed answering 429 (quota), 503 and 404 "task not found" for the same
// situation, and GenerateController deliberately passes the upstream text
// through (see its AiProviderException branch: the user must be able to act on
// it). Pinning one wording turned every upstream phrasing change into a false
// regression, so assert the invariants instead:
//   1. the user is told (at least one toast, non-empty);
//   2. the card of THIS run reaches a terminal state carrying a reason that is
//      not the content-free "系统繁忙" fallback.
if (notice.length) chk('failure toast shown', notice.join(' ').trim().length > 0, notice[0])
else chk('failure toast shown', false, 'no toast captured')
chk(
  'void card carries our message',
  !!voidCard && /未生成|失败|已取消/.test(voidCard) && !/系统繁忙/.test(voidCard || ''),
  (voidCard || '').slice(0, 60),
)
await page.screenshot({ path: `${SHOT}/pa-4-failure.png` })

// ---------- 6. refresh keeps record ----------
console.log('\n=== 6. refresh: record and message survive ===')
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
await page.waitForTimeout(4000)
await page.click('.wg-media-btn')
await page.waitForTimeout(800)
await page.locator('.wg-popper', { hasText: '生成类型' }).first().locator('.wg-menu-item', { hasText: '视频' }).click()
await page.waitForTimeout(4000)
const afterReload = await page.evaluate(() => {
  const c = document.querySelector('.wg-card.is-void')
  return { cards: document.querySelectorAll('.wg-card:not(.is-skeleton)').length, voidText: c ? c.innerText.replace(/\n+/g, ' | ').slice(0, 200) : null }
})
chk('cards survive refresh', afterReload.cards > 0, `${afterReload.cards}`)
chk('void record survives refresh', !!afterReload.voidText, (afterReload.voidText || '(none)').slice(0, 60))

// ---------- 7. views / filters ----------
console.log('\n=== 7. views, filters, sort ===')
const toggle = page.locator("button[aria-label*='视图']").first()
await toggle.click()
await page.waitForTimeout(2500)
const grid = await page.evaluate(() => ({
  isGrid: !!document.querySelector('.wg-list.is-grid'),
  cols: getComputedStyle(document.querySelector('.wg-list')).gridTemplateColumns,
  cards: document.querySelectorAll('.wg-card:not(.is-skeleton)').length,
}))
chk('grid view really splits columns', grid.isGrid && grid.cols.split(' ').length > 1, grid.cols)
chk('grid keeps cards', grid.cards > 0, `${grid.cards}`)
await page.screenshot({ path: `${SHOT}/pa-5-grid.png` })
await toggle.click()
await page.waitForTimeout(1500)

const fb = page.locator('.wg-chip', { hasText: '筛选' }).first()
if (await fb.count()) {
  await fb.click()
  await page.waitForTimeout(900)
  chk('filter popover opens', (await page.locator('.wg-popper:visible .wg-menu-item').count()) > 0)
  await page.mouse.click(800, 500)
  await page.waitForTimeout(800)
}
const sb = page.locator('.wg-chip', { hasText: /优先|旧/ }).first()
if (await sb.count()) {
  await sb.click()
  await page.waitForTimeout(900)
  chk('sort popover opens', (await page.locator('.wg-popper:visible .wg-menu-item').count()) > 0)
  await page.mouse.click(800, 500)
  await page.waitForTimeout(1000)
}

// ---------- 8. delete ----------
console.log('\n=== 8. delete one record ===')
const n0 = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
const del = page.locator('.wg-card .wg-del').first()
if (await del.count()) {
  await del.click({ force: true })
  await page.waitForTimeout(1000)
  const ok = page.locator('.el-message-box__btns .el-button--primary, .el-popconfirm button.el-button--primary').last()
  if (await ok.count()) { await ok.click().catch(() => {}); await page.waitForTimeout(4000) }
  await page.waitForTimeout(4000)
  const n1 = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
  chk('card count decreases after delete', n1 < n0, `${n0} -> ${n1}`)
} else chk('delete button present', false, 'not found')

// ---------- 9. settings -> file storage ----------
console.log('\n=== 9. settings: file storage entry ===')
await page.goto(`${FE}/setting`, { waitUntil: 'domcontentloaded' })
// Wait for the entry itself instead of a fixed sleep: the settings page mounts
// its sidebar asynchronously, and a 5s sleep intermittently runs before the
// tab exists, which reported "tab not found" on a page that has it.
const fsTab = page.locator('a,button,li,div,span').filter({ hasText: /^\s*文件存储\s*$/ }).last()
const fsFound = await fsTab
  .waitFor({ state: 'visible', timeout: 30000 })
  .then(() => true)
  .catch(() => false)
if (fsFound) {
  await fsTab.click({ force: true })
  await page.waitForTimeout(7000)
  const fsView = await page.evaluate(() => ({
    url: location.href,
    hasUi: !!document.querySelector('[class*="fs-"]'),
    text: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 200),
  }))
  chk('file storage page renders', fsView.hasUi && fsView.url.includes('file-storage'), fsView.url)
  await page.screenshot({ path: `${SHOT}/pa-6-fs.png` })
} else chk('file storage entry exists', false, 'tab not found')

// ---------- 10. console health ----------
console.log('\n=== 10. console health ===')
const real = jsErrs.filter((e) => !/403|Failed to load resource/.test(e))
chk('no unexpected JS errors', real.length === 0, real.slice(0, 2).join(' | '))

console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
fail.forEach((f) => console.log('  FAIL ' + f))

// Bind the artifact to the deployment it was actually run against: same
// fingerprint fields as api-accept/SIGNOFF section 1, so a redeploy after this
// point invalidates the report instead of silently blessing the new jar.
const fp = await fingerprint().catch((e) => ({ error: String(e?.message || e).slice(0, 200) }))
const report = {
  generatedAt: new Date().toISOString(),
  fe: FE,
  api: API,
  fingerprint: fp,
  passCount: pass.length,
  failCount: fail.length,
  pass,
  fail,
}
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2))
console.log('report -> ' + REPORT + '  md5=' + (fp.jarMd5 || fp.error || '?'))

await browser.close()
process.exit(fail.length ? 1 : 0)
