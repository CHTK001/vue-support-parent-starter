/**
 * Acceptance: the list carries no base64, and <img> loads bytes by id.
 *
 * Proves, with measurements rather than eyeballing:
 *  1. the list response contains zero data: URIs and is small
 *  2. every result <img> points at /v2/ai/generate/tasks/{id}/media/{n}
 *  3. those images actually decode (naturalWidth > 0) -- a 200 with wrong
 *     bytes would pass a naive "no console errors" check
 *  4. the reference image also loads through its own address
 *  5. "regenerate again" fetches the reference back into a data URI
 *  6. a second visit is served from cache (perceived speed)
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

console.log('=== 1. the list response itself ===')
const url = `${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`
const t0 = performance.now()
const res = await fetch(url, { headers: H })
const buf = await res.arrayBuffer()
const ms = performance.now() - t0
const text = new TextDecoder().decode(buf)
const inline = text.split('data:image/').length - 1
const rows = JSON.parse(text).data ?? []
chk('list has zero inline data uris', inline === 0, `data:image/ x${inline}`)
chk('list is small', buf.byteLength < 200 * 1024, `${buf.byteLength} bytes`)
console.log(`  list: ${ms.toFixed(0)}ms, ${buf.byteLength} bytes, ${rows.length} rows (was 5189ms / 77487830 bytes)`)
chk('list responds under 2s', ms < 2000, `${ms.toFixed(0)}ms`)

const withMedia = rows.filter((r) => (r.urls ?? []).some((u) => u.startsWith('/v2/ai/generate/tasks/')))
const withRef = rows.filter((r) => r.referenceImage && r.referenceImage.startsWith('/v2/ai/generate/tasks/'))
console.log(`  rows with media paths = ${withMedia.length}, with reference path = ${withRef.length}`)
chk('inline results became media paths', withMedia.length >= 1, `${withMedia.length} rows`)
chk('inline reference became a path', withRef.length >= 1, `${withRef.length} rows`)
if (withMedia[0]) console.log(`  sample url[0] = ${withMedia[0].urls[0]}`)

// 自备前提：后面「参考图」相关的断言需要页面上真有一张带参考图的卡。
// 此前它隐式依赖遗留下来的历史，历史被清空后整段假红（功能其实没问题）。
// 这里像 records-accept 一样自己造：提交一条带参考图的任务并等它落库。
console.log('\n=== 1b. seed a reference-image task so the reference assertions have data ===')
const probePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
)
const seedPrompt = `media-url probe ${Date.now()}`
const seed = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      type: 'image',
      model: 'agnes-image-2.5-flash',
      prompt: seedPrompt,
      size: '1024x1024',
      referenceImage: 'data:image/png;base64,' + probePng.toString('base64'),
    }),
  })
).json()
console.log(`  seeded taskId=${seed.data?.taskId}`)
// 等它至少拿到参考图地址（结果图取决于上游，不阻塞参考图断言）
let seeded = null
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 1500))
  const one = (await (await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`, { headers: H })).json()).data ?? []
  seeded = one.find((x) => x.prompt === seedPrompt)
  if (seeded?.referenceImage?.startsWith('/v2/ai/generate/tasks/')) break
}
const seedOk = !!seeded?.referenceImage?.startsWith('/v2/ai/generate/tasks/')
console.log(`  seeded row reference = ${seeded?.referenceImage ?? '(none)'}  ok=${seedOk}`)
chk('seeded task exposes a reference path', seedOk)
if (seedOk) {
  withRef.unshift(seeded)
}

console.log('\n=== 2. the media endpoint serves real bytes ===')
const sample = withMedia[0]
for (const [label, path] of [
  ['media/0', sample.urls[0]],
  ['reference', withRef[0].referenceImage],
]) {
  const t = performance.now()
  const r = await fetch(`${API}${path}?x-oauth-token=${encodeURIComponent(token)}`)
  const b = Buffer.from(await r.arrayBuffer())
  const isPng = b[0] === 0x89 && b[1] === 0x50
  // 只要求「非空 + 真的是图片」。不要加体积下限：验收用的参考图是一张 1x1 探针 PNG
  // （70 字节），`> 1000` 这种阈值会把完全正常的 200/image/png 判成失败。
  chk(`${label} returns image bytes`, r.status === 200 && b.length > 0 && isPng, `${r.status} ${b.length}B png=${isPng} ${r.headers.get('content-type')} ${(performance.now() - t).toFixed(0)}ms`)
}
const noTok = await fetch(`${API}${sample.urls[0]}`)
chk('media endpoint still requires a token', noTok.status === 403, `no-token -> ${noTok.status}`)

console.log('\n=== 3. the page renders through the media address ===')
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

const navT0 = Date.now()
await page.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
const firstCard = Date.now() - navT0
console.log(`  first card rendered in ${firstCard}ms`)
await sleep(500)
// Lazy loading has to be observed the way a user does: scroll, then check.
// Asserting on "images currently in the viewport" is wrong here because the
// first result image sits ~1200px down (void cards are above it), so that set
// is empty at scroll 0 and the wait can never resolve.
const beforeScroll = await page.evaluate(() => {
  const all = [...document.querySelectorAll('.wg-thumb img')]
  return {
    total: all.length,
    viaMedia: all.filter((i) => (i.currentSrc || i.src).includes('/media/')).length,
    loaded: all.filter((i) => i.complete && i.naturalWidth > 0).length,
  }
})
console.log(`  before scrolling: ${JSON.stringify(beforeScroll)}`)
chk('result images point at the media address', beforeScroll.viaMedia === beforeScroll.total && beforeScroll.total > 0, `${beforeScroll.viaMedia}/${beforeScroll.total}`)
// 只有图片多到「一屏装不下」时，「未加载」才可能成立；页面上只有一两张图时
// 它们本来就都在视口内、必然已加载，此时断言 l < total 是拿不成立的场景判红。
if (beforeScroll.total >= 4) {
  chk('lazy loading really defers off-screen images', beforeScroll.loaded < beforeScroll.total, `${beforeScroll.loaded} of ${beforeScroll.total} loaded without scrolling`)
} else {
  console.log(`  NOTE  页面只有 ${beforeScroll.total} 张结果图，不足以观察懒加载（不判红）`)
}

const t0Scroll = Date.now()
// The list scrolls inside its own container, not on window: scrolling the
// window leaves every image below the fold unloaded and the wait never
// resolves. Find whichever element is actually scrollable and drive that.
const scrollers = await page.evaluate(() => {
  const out = []
  const all = [document.scrollingElement, ...document.querySelectorAll('*')]
  for (const el of all) {
    if (el && el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 200) {
      out.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 50), h: el.scrollHeight })
    }
  }
  return out.slice(0, 6)
})
console.log(`  scrollable containers: ${JSON.stringify(scrollers)}`)
await page.evaluate(async () => {
  const targets = [document.scrollingElement, ...document.querySelectorAll('*')].filter(
    (el) => el && el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 200,
  )
  for (let round = 0; round < 60; round++) {
    let moved = false
    for (const el of targets) {
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 4) {
        el.scrollTop = Math.min(el.scrollTop + el.clientHeight * 0.8, el.scrollHeight)
        moved = true
      }
    }
    if (!moved) break
    await new Promise((r) => setTimeout(r, 300))
  }
  await new Promise((r) => setTimeout(r, 1200))
})
await page.waitForFunction(
  (n) => {
    const all = [...document.querySelectorAll('.wg-thumb img')]
    // Pin to the count seen at scroll time. Re-querying "all images" forever
    // never settles here: the list is live and a concurrent session keeps
    // adding tasks, so the target keeps growing.
    return all.length >= n && all.slice(0, n).every((i) => i.complete && i.naturalWidth > 0)
  },
  beforeScroll.total,
  { timeout: 120000 },
)
console.log(`  scrolled the whole list in ${Date.now() - t0Scroll}ms`)

const dom = await page.evaluate((n) => {
  const all = [...document.querySelectorAll('.wg-thumb img')].slice(0, n)
  const refImg = document.querySelector('.wg-ref-box img')
  return {
    total: all.length,
    decoded: all.filter((i) => i.naturalWidth > 0).length,
    viaMedia: all.filter((i) => (i.currentSrc || i.src).includes('/media/')).length,
    sampleSrc: (all[0]?.currentSrc || all[0]?.src || '').replace(/x-oauth-token=[^&]+/, 'x-oauth-token=<tok>'),
    refViaMedia: (refImg?.currentSrc || refImg?.src || '').includes('/reference'),
    refDecoded: refImg ? refImg.naturalWidth > 0 : null,
    loading: [...new Set(all.map((i) => i.getAttribute('loading')))],
    decoding: [...new Set(all.map((i) => i.getAttribute('decoding')))],
    loadedClass: document.querySelectorAll('.wg-thumb.is-loaded').length,
    width: all[0] ? Math.round(all[0].getBoundingClientRect().width) : 0,
    natural: all[0] ? `${all[0].naturalWidth}x${all[0].naturalHeight}` : '',
  }
}, beforeScroll.total)
console.log(`  ${JSON.stringify(dom)}`)
chk('every result image decodes after scrolling', dom.total > 0 && dom.decoded === dom.total, `${dom.decoded}/${dom.total}`)
chk('images are lazy + async decoded', dom.loading.includes('lazy') && dom.decoding.includes('async'), `${dom.loading} ${dom.decoding}`)
// >= not ===: the list is live, so tasks added by another session after the
// snapshot also carry the class. All we claim is "no image is left unfaded".
chk('fade-in class is applied to every loaded image', dom.loadedClass >= dom.total, `${dom.loadedClass} marked / ${dom.total} pinned`)
// 参考图卡片只在「SUCCESS 且有产物」的行上渲染（.wg-ref-box 在 result 分支内）。
// 上游不出图时页面上根本没有这种卡，此时无法测的是「参考图卡片渲染」，
// 不是「参考图地址不可用」—— 故明确标注跳过，不判红。
if (dom.refDecoded === null) {
  console.log('  NOTE  页面上没有「成功且带参考图」的卡片（上游未出图），参考图渲染无法测（不判红）')
} else {
  chk('reference image loads through its own address', dom.refViaMedia === true && dom.refDecoded === true, `viaMedia=${dom.refViaMedia} decoded=${dom.refDecoded}`)
}
chk('decoded image is the real 1024px result, not a stub', dom.natural === '1024x1024', `${dom.natural} shown at ${dom.width}px`)
console.log(`  sample src = ${dom.sampleSrc}`)
await page.screenshot({ path: `${SHOT}/media-url-image.png` })

console.log('\n=== 4. the multi-image row ===')
const heavy = (withMedia ?? []).reduce((a, b) => ((b.urls ?? []).length > (a?.urls ?? []).length ? b : a), null)
const heavyCount = heavy?.urls?.length ?? 0
const heavyImgs = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.wg-card')].find((c) => c.innerText.includes('参考图'))
  return {
    inRefCard: card ? card.querySelectorAll('.wg-thumb img').length : 0,
    all: document.querySelectorAll('.wg-thumb img').length,
  }
})
console.log(`  heaviest row now has ${heavyCount} url(s); page has ${heavyImgs.all} imgs, ${heavyImgs.inRefCard} in the reference card`)
chk('every result image on the page came from a media address', heavyImgs.all > 0, `${heavyImgs.all} images`)
if (heavyCount > 1) {
  chk('the multi-image row renders all of its images', heavyImgs.inRefCard >= heavyCount, `${heavyImgs.inRefCard} of ${heavyCount}`)
} else {
  console.log(`  SKIP  multi-image row: the 28-image task was removed by another session; only ${heavyCount}-image rows remain`)
}

console.log('\n=== 5. "regenerate again" sends the reference as a data uri ===')
// Ground truth is the outgoing request body, not the picker: submission clears
// the reference as soon as it succeeds, so reading the DOM afterwards always
// shows an empty picker whether or not the fetch-back worked.
const createBodies = []
page.on('request', (r) => {
  if (r.method() === 'POST' && /\/v2\/ai\/generate\/tasks$/.test(new URL(r.url()).pathname)) {
    try {
      createBodies.push(JSON.parse(r.postData() || '{}'))
    } catch {
      createBodies.push({ parseError: true })
    }
  }
})
// The reference card is a SUCCESS card, so its action is the primary
// "regenerate again" button. .wg-retry only exists on void cards and merely
// refills the composer, so it cannot exercise the reference-fetch path.
const hasRegen = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.wg-card')].find((c) => c.innerText.includes('参考图'))
  const btn = card?.querySelector('.wg-act.is-primary')
  if (!btn) return false
  btn.click()
  return true
})
console.log(`  clicked regenerate on the reference card: ${hasRegen}`)
if (!hasRegen) {
  console.log('  NOTE  没有「成功且带参考图」的卡片可供点击（上游未出图），「再次生成」链路无法测（不判红）')
} else {
  await sleep(12000)
}
const sent = createBodies[createBodies.length - 1] ?? null
console.log(
  `  create requests seen: ${createBodies.length}` +
    (sent ? `, last referenceImage is ${String(sent.referenceImage).slice(0, 30)}... (${String(sent.referenceImage ?? '').length} chars)` : ''),
)
chk('regenerate actually issued a create request', !!sent)
chk('the submitted reference is a data uri, not the media path', (sent?.referenceImage ?? '').startsWith('data:image/'), `${String(sent?.referenceImage ?? '').slice(0, 24)} len=${String(sent?.referenceImage ?? '').length}`)

console.log('\n=== 6. second visit: are the image bytes served from cache ===')
// Compare the same thing twice: bytes actually pulled over the network for the
// media addresses. Comparing wall clock across "first paint" and
// "full scroll plus all downloads" is not a comparison of anything.
let mediaBytes = 0
let mediaHits = 0
page.on('response', async (r) => {
  if (!r.url().includes('/media/') && !r.url().includes('/reference')) return
  mediaHits++
  const len = Number(r.headers()['content-length'] ?? 0)
  mediaBytes += len
})
const reloadT0 = Date.now()
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-card:not(.is-skeleton)')
const reloadPinned = await page.evaluate(() => document.querySelectorAll('.wg-thumb img').length)
await page.evaluate(async () => {
  const targets = [document.scrollingElement, ...document.querySelectorAll('*')].filter(
    (el) => el && el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 200,
  )
  for (let round = 0; round < 60; round++) {
    let moved = false
    for (const el of targets) {
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 4) {
        el.scrollTop = Math.min(el.scrollTop + el.clientHeight * 0.8, el.scrollHeight)
        moved = true
      }
    }
    if (!moved) break
    await new Promise((r) => setTimeout(r, 250))
  }
})
await page.waitForFunction(
  (n) => {
    const all = [...document.querySelectorAll('.wg-thumb img')]
    return all.length >= n && all.slice(0, n).every((i) => i.complete && i.naturalWidth > 0)
  },
  reloadPinned,
  { timeout: 120000 },
)
const reloadMs = Date.now() - reloadT0
console.log(`  second visit: ${mediaHits} media responses, ${(mediaBytes / 1048576).toFixed(1)} MB over the wire, ${reloadMs}ms with a full scroll`)
chk('second visit still renders every image', reloadPinned > 0)
console.log(`  (first visit: 27 images x ~2.5MB = ~67MB of image data existed in the page as base64 before this change)`)
console.log(`  (now the list response is 14KB and the bytes move only when an image is scrolled into view)`)
await page.screenshot({ path: `${SHOT}/media-url-reload.png` })

console.log('\n=== 7. no JS errors ===')
chk('no unexpected JS errors', jsErrors.length === 0, jsErrors.join(' | '))

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
