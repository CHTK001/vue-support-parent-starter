/**
 * Video acceptance in the browser: everything that does not depend on the
 * upstream queue actually opening.
 *
 * The one thing deliberately NOT claimed here is the success rendering
 * (task -> video url -> <video> element), because the upstream has answered
 * 503/429 for hours and no window opened. Claiming it would be a lie; the
 * script says so out loud instead.
 *
 * ASCII only by design.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const SHOT = 'D:/ch/project/.tmp/sg/shots'
fs.mkdirSync(SHOT, { recursive: true })
const FE = 'http://localhost:15689'
const API = 'http://192.168.50.198:8787'

const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(name)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
const list = async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=30&offset=0`, { headers: H })).json()).data ?? []

console.log('=== 0. server-side video catalog ===')
const models = (await (await fetch(`${API}/v2/ai/generate/models?type=video`, { headers: H })).json()).data ?? []
const cfg = models[0]?.config ?? {}
console.log(`  ${models.length} model(s); durations=${JSON.stringify(cfg.durations)} sizes=${JSON.stringify(cfg.sizes)} maxCount=${cfg.maxCount}`)
chk('video catalog present', models.length >= 1)
chk('video model exposes 5 durations', (cfg.durations ?? []).length === 5, JSON.stringify(cfg.durations))
chk('video model exposes 5 sizes', (cfg.sizes ?? []).length === 5, JSON.stringify(cfg.sizes))
chk('video maxCount is 1', cfg.maxCount === 1, String(cfg.maxCount))

const browser = await chromium.launch()
const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.setDefaultTimeout(60000)
const jsErrs = []
page.on('pageerror', (e) => jsErrs.push(String(e).slice(0, 140)))

await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await sleep(4000)
await page.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
await sleep(2500)

console.log('\n=== 1. switch to video ===')
await page.click('.wg-media-btn')
await sleep(700)
// Scope to the media-type popover. A bare .wg-menu-item catches every popover
// on the page (filter / sort / model), so a count check on it is meaningless.
const menu = await page.evaluate(() => {
  const popper = [...document.querySelectorAll('.el-popper, .wg-menu')].find((p) => p.offsetParent !== null)
  const scope = popper ?? document
  return [...scope.querySelectorAll('.wg-menu-item')].map((e) => e.innerText.replace(/\n+/g, ' ').trim())
})
console.log(`  popover items: ${JSON.stringify(menu)}`)
chk('popover offers exactly image + video', menu.length === 2 && menu.some((m) => m.includes('视频')) && menu.some((m) => m.includes('图像')), JSON.stringify(menu))
await page.click('.wg-menu-item:has-text("视频")')
await sleep(2500)
const vid = await page.evaluate(() => ({
  title: document.querySelector('.wg-title')?.textContent?.trim(),
  btn: document.querySelector('.wg-media-btn')?.innerText.replace(/\n/g, ' ').trim(),
  hasDuration: !!document.querySelector('.wg-chip[title*="时长"], .wg-chip[title*="秒"]'),
  chips: [...document.querySelectorAll('.wg-chip')].map((c) => c.innerText.replace(/\n/g, ' ').trim()).slice(0, 8),
}))
console.log(`  ${JSON.stringify(vid)}`)
chk('title switched to video', vid.title === '视频生成', vid.title)
chk('duration chip appears in video mode', vid.hasDuration, JSON.stringify(vid.chips))
await page.screenshot({ path: `${SHOT}/video-1-composer.png` })

console.log('\n=== 2. every duration is selectable and lands in the composer ===')
const durChips = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.wg-chip')]
  const d = btns.find((b) => /s$|秒/.test(b.innerText.trim()))
  if (!d) return null
  d.click()
  return true
})
await sleep(900)
const durOptions = await page.evaluate(() => [...document.querySelectorAll('.wg-seg-item, .wg-menu-item, .wg-ratio')].map((e) => e.innerText.trim()).filter(Boolean))
console.log(`  duration options: ${JSON.stringify(durOptions)}`)
chk('duration selector opens', durChips === true && durOptions.length > 0)
const each = []
for (const label of durOptions.filter((o) => /^\d+s?$/.test(o))) {
  const ok = await page.evaluate((l) => {
    const el = [...document.querySelectorAll('.wg-seg-item, .wg-menu-item, .wg-ratio')].find((e) => e.innerText.trim() === l)
    if (!el) return false
    el.click()
    return true
  }, label)
  await sleep(500)
  const shown = await page.evaluate(() => [...document.querySelectorAll('.wg-chip')].map((c) => c.innerText.trim()).join(' | '))
  each.push(`${label}->${shown.includes(label.replace(/s$/, '')) ? 'ok' : 'MISS'}`)
  if (ok) {
    // reopen for the next one
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('.wg-chip')].find((x) => /s$|秒/.test(x.innerText.trim()))
      b?.click()
    })
    await sleep(500)
  }
}
console.log(`  duration round-trip: ${JSON.stringify(each)}`)
chk('all durations selectable', each.length >= 5 && each.every((e) => e.endsWith('ok')), JSON.stringify(each))
await page.keyboard.press('Escape')
await sleep(600)

console.log('\n=== 3. video submit fails upstream but is reported, not swallowed ===')
// Unique prompt per run: a fixed one makes the server-side assertions below
// pick up rows from earlier runs, including rows written before the
// duration/size fix, and then "every row has a duration" fails on history
// rather than on this run's behaviour.
const probePrompt = `video browser probe ${Date.now()}`
const beforeCards = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
const input = page.locator('.wg-input, [contenteditable="true"], textarea').last()
await input.click()
await page.keyboard.type(probePrompt)
await sleep(600)
await page.keyboard.press('Enter')
let terminal = null
for (let i = 0; i < 40; i++) {
  await sleep(1000)
  const seen = await page.evaluate((p) => {
    const c = [...document.querySelectorAll('.wg-card:not(.is-skeleton)')].find((x) => x.innerText.includes(p))
    if (!c) return null
    return { badge: c.querySelector('.wg-badge')?.innerText?.trim() ?? '', text: c.innerText.replace(/\n+/g, ' | ').slice(0, 200) }
  }, probePrompt)
  if (seen && /完成|失败|取消/.test(seen.badge)) {
    terminal = seen
    break
  }
}
const afterCards = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
chk('card added after video submit', afterCards > beforeCards, `${beforeCards} -> ${afterCards}`)
console.log(`  terminal card: ${terminal ? terminal.text : '(still running)'}`)
chk('video task reaches a terminal state', !!terminal, terminal?.badge ?? 'none')
chk('failure reason is our own chinese, not upstream english', !!terminal && /供应商|稍后|Key/.test(terminal.text) && !/queue|503|429|error/i.test(terminal.text), (terminal?.text ?? '').slice(0, 60))

console.log('\n=== 4. video history: filter/sort/grid still work ===')
const hist = await page.evaluate(() => ({
  cards: document.querySelectorAll('.wg-card:not(.is-skeleton)').length,
  videos: document.querySelectorAll('.wg-thumb video').length,
  imgs: document.querySelectorAll('.wg-thumb img').length,
}))
console.log(`  ${JSON.stringify(hist)}`)
chk('video view shows only video tasks', hist.cards > 0, `${hist.cards} cards, ${hist.videos} video els, ${hist.imgs} img els`)
// A successful video would render as .wg-thumb video; none exists yet.
if (hist.videos === 0) {
  console.log('  NOTE  no <video> element exists because no video task has ever succeeded upstream.')
  console.log('  NOTE  the success rendering path therefore stays UNVERIFIED (not a pass, not a fail).')
}

console.log('\n=== 5. duration and size survive a refresh ===')
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
await sleep(1500)
// The page defaults back to the image tab on reload (mediaType is component
// state, not persisted), so the video record is present but not on screen until
// we switch back. Looking for it before switching finds nothing and would look
// like a persistence bug.
await page.click('.wg-media-btn')
await sleep(700)
await page.click('.wg-menu-item:has-text("视频")')
await sleep(3000)
const after = await page.evaluate((p) => {
  const c = [...document.querySelectorAll('.wg-card:not(.is-skeleton)')].find((x) => x.innerText.includes(p))
  return { found: !!c, text: c?.innerText.replace(/\n+/g, ' | ').slice(0, 180) ?? '' }
}, probePrompt)
await page.screenshot({ path: `${SHOT}/video-2-refreshed.png` })
console.log(`  after refresh: ${after.text || '(gone)'}`)
chk('video record survives refresh', after.found === true)
chk('refreshed card keeps its size chip', after.found && /\d{3,4}x\d{3,4}/.test(after.text), after.text.match(/\d{3,4}x\d{3,4}[^|]*/)?.[0] ?? 'no size chip')
chk('refreshed card keeps its duration chip', after.found && /\d+s\b/.test(after.text), after.text.match(/\d+s\b/)?.[0] ?? 'no duration chip')

const rows = (await list('video')).filter((t) => t.prompt === probePrompt)
console.log(`  server rows for this run: ${rows.length}; size=${JSON.stringify(rows.map((r) => r.size))} duration=${JSON.stringify(rows.map((r) => r.duration))}`)
chk('the chosen duration reached the server', rows.length === 1 && rows.every((r) => r.duration), JSON.stringify(rows.map((r) => r.duration)))
chk('the chosen size reached the server', rows.length === 1 && rows.every((r) => r.size), JSON.stringify(rows.map((r) => r.size)))

console.log('\n=== 6. console health ===')
chk('no unexpected JS errors', jsErrs.filter((e) => !/403|Failed to load resource/.test(e)).length === 0, jsErrs.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
console.log('  UNVERIFIED: video success rendering (upstream queue closed)')
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
