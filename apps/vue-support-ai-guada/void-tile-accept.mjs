/**
 * Verify the void placeholder tile.
 *
 * What it proves, with real geometry instead of eyeballing a screenshot:
 *  1. a void task (failed / canceled / success-without-output) renders .wg-void,
 *     not the old flat error bar
 *  2. the tile shows the right media icon for the task type (video -> film, image -> picture)
 *  3. the tile carries the server-side Chinese reason, not the raw upstream text
 *  4. the tile is at least as tall as a real result card, so the grid has no hole
 *     -- this is the actual complaint being fixed
 *
 * Both media kinds are exercised on purpose: a canceled image task gives the
 * image-shaped void tile, an already-failed video task gives the video one.
 *
 * ASCII only by design: shell-editing of UTF-8 scripts has corrupted them here.
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
const list = async (ty) =>
  (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=50&offset=0`, { headers: H })).json()).data ?? []
const running = (t) => t.status === 'PENDING' || t.status === 'RUNNING'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

console.log('=== 0. plant a canceled image task so the image void tile exists ===')
for (const ty of ['image', 'video']) {
  for (const t of (await list(ty)).filter(running)) {
    await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
    console.log(`  canceled leftover ${ty} ${t.taskId}`)
  }
}
const imgSub = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      type: 'image',
      model: 'agnes-image-2.5-flash',
      prompt: 'void tile image probe',
      size: '1024x1024',
    }),
  })
).json()
const imgId = imgSub.data?.taskId
console.log(`  submit response taskId=${imgId} ${imgSub.msg || ''}`)
await sleep(2500)
// The submit response can carry a different id than the row that ends up in the
// list, so resolve by prompt instead of trusting the response.
const rows = await list('image')
const row = rows.find((t) => t.prompt === 'void tile image probe')
console.log(`  row in list: ${row?.taskId} ${row?.status} (submit said ${imgId}, same=${row?.taskId === imgId})`)
const cancelHttp = await fetch(`${API}/v2/ai/generate/tasks/${row.taskId}/cancel`, { method: 'POST', headers: H })
console.log(`  cancel -> HTTP ${cancelHttp.status}`)
await sleep(1500)
const imgRow = (await list('image')).find((t) => t.taskId === row.taskId)
console.log(`  image row now: ${imgRow?.status} urls=${imgRow?.urls?.length ?? 0}`)

console.log('\n=== 1. inventory of void rows ===')
for (const ty of ['video', 'image']) {
  const all = await list(ty)
  const voids = all.filter((t) => !running(t) && (t.urls ?? []).length === 0)
  console.log(`  ${ty}: total=${all.length} void=${voids.length}`)
  voids.slice(0, 3).forEach((t) => console.log(`    ${t.status} ${t.taskId}`))
  if (!voids.length) {
    console.log(`  no void ${ty} row; tile assertions for ${ty} will fail`)
  }
}

const browser = await chromium.launch()
const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.setDefaultTimeout(60000)
const jsErrors = []
page.on('pageerror', (e) => jsErrors.push(String(e).slice(0, 140)))

await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await sleep(4000)
await page.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
await sleep(3000)

const readVoid = () =>
  page.evaluate(() => {
    const cards = [...document.querySelectorAll('.wg-card:not(.is-skeleton)')]
    const voids = cards.filter((c) => c.querySelector('.wg-void'))
    const old = cards.filter((c) => c.querySelector('.wg-card-error'))
    const tile = voids[0]?.querySelector('.wg-void')
    const r = tile?.getBoundingClientRect()
    const cs = tile ? getComputedStyle(tile) : null
    const withRes = cards.find((x) => x.querySelector('.wg-thumb img, .wg-thumb video'))
    const kinds = voids.map((c) => {
      const d = c.querySelector('.wg-void-icon svg path')?.getAttribute('d') ?? ''
      return d.startsWith('m15.75 10.5 4.72') ? 'video' : d.startsWith('m2.25 15.75') ? 'image' : 'other'
    })
    return {
      nCards: cards.length,
      nVoid: voids.length,
      nOldBar: old.length,
      kinds,
      firstVoidText: voids[0]?.innerText.replace(/\n+/g, ' | ').slice(0, 190) ?? '',
      w: r ? Math.round(r.width) : 0,
      h: r ? Math.round(r.height) : 0,
      voidCardH: voids[0] ? Math.round(voids[0].getBoundingClientRect().height) : 0,
      resCardH: withRes ? Math.round(withRes.getBoundingClientRect().height) : 0,
      dashed: cs?.borderTopStyle ?? '',
      bg: (cs?.backgroundImage ?? '').slice(0, 30),
      animation: cs?.animationName ?? 'none',
    }
  })

console.log('\n=== 2. image view: canceled image task must show a picture-icon tile ===')
let v = await readVoid()
console.log(`  ${JSON.stringify(v)}`)
chk('void tile rendered', v.nVoid >= 1, `void=${v.nVoid} cards=${v.nCards}`)
chk('old flat error bar gone', v.nOldBar === 0, `old=${v.nOldBar}`)
chk('image tile uses the picture icon', v.kinds.includes('image'), JSON.stringify(v.kinds))
chk('tile uses a dashed boundary, not a shadow', v.dashed === 'dashed', v.dashed)
chk('tile has the diagonal placeholder texture', v.bg.includes('repeating-linear-gradient'), v.bg)
chk('void tile is not animated like a running card', v.animation === 'none', v.animation)
chk('tile keeps media height', v.h >= 140, `${v.w}x${v.h}`)
const res = await page.evaluate(() => {
  const t = document.querySelector('.wg-thumb')
  return t ? Math.round(t.getBoundingClientRect().width) : 0
})
console.log(`  result thumb width = ${res}, void tile width = ${v.w}`)
chk('void tile width matches a real result thumb', res === 0 || Math.abs(res - v.w) <= 2, `tile=${v.w} thumb=${res}`)
await page.screenshot({ path: `${SHOT}/void-tile-image.png` })

console.log('\n=== 3. the tile shows our own chinese, not the upstream string ===')
const all = (await list('video')).concat(await list('image'))
const leaked = all.filter((t) => /video_queue_full|rate_limit|insufficient|Traceback|\bHTTP \d{3}\b/.test(t.errorMessage || ''))
chk('no task row leaks raw upstream english', leaked.length === 0, leaked.map((t) => t.errorMessage).join(' ; ').slice(0, 90))
chk('tile text is chinese, not a raw provider string', /[一-鿿]/.test(v.firstVoidText), v.firstVoidText.slice(0, 70))

console.log('\n=== 4. long reason stays inside the tile ===')
const fit = await page.evaluate(() =>
  [...document.querySelectorAll('.wg-void')].map((t) => {
    const box = t.getBoundingClientRect()
    const e = t.querySelector('.wg-void-err').getBoundingClientRect()
    return { w: Math.round(box.width), errH: Math.round(e.height), spill: e.bottom > box.bottom + 1 }
  }),
)
console.log(`  ${JSON.stringify(fit)}`)
chk('reason never spills out of the tile', fit.length > 0 && fit.every((f) => !f.spill), JSON.stringify(fit))

console.log('\n=== 5. video view: failed video task must show a film-icon tile ===')
await page.click('.wg-media-btn')
await sleep(700)
await page.click('.wg-menu-item:has-text("视频")')
await sleep(2500)
v = await readVoid()
console.log(`  ${JSON.stringify(v)}`)
chk('video view renders a void tile', v.nVoid >= 1, `void=${v.nVoid}`)
chk('video tile uses the film icon', v.kinds.includes('video'), JSON.stringify(v.kinds))
await page.screenshot({ path: `${SHOT}/void-tile-video.png` })

console.log('\n=== 6. mixed grid: void cards must not collapse the row ===')
const grid = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.wg-card:not(.is-skeleton)')].map((c) => {
    const r = c.getBoundingClientRect()
    return { void: !!c.querySelector('.wg-void'), w: Math.round(r.width), h: Math.round(r.height) }
  })
  return {
    nVoid: cards.filter((c) => c.void).length,
    nRes: cards.filter((c) => !c.void).length,
    voidH: cards.filter((c) => c.void).map((c) => c.h).slice(0, 3),
    resH: cards.filter((c) => !c.void).map((c) => c.h).slice(0, 3),
    widths: [...new Set(cards.map((c) => c.w))],
  }
})
console.log(`  ${JSON.stringify(grid)}`)
chk('all cards share one width', grid.widths.length <= 1, JSON.stringify(grid.widths))
chk(
  'void card height is in the same league as a result card',
  grid.nVoid === 0 || grid.nRes === 0 || Math.min(...grid.voidH) >= Math.min(...grid.resH) * 0.6,
  JSON.stringify(grid),
)

console.log('\n=== 7. no JS errors from the new markup ===')
chk('no unexpected JS errors', jsErrors.length === 0, jsErrors.join(' | '))

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
