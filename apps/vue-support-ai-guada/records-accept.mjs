/**
 * Acceptance for the three reported issues.
 *
 *  1. the "清理失败 N" badge and what actually gets deleted must agree
 *     (the badge counted FAILED+CANCELED, the backend only deleted FAILED)
 *  2. clicking it must open a popover with 清理失败 / 批量删除 / 清空全部
 *     - 批量删除: tick records, then delete only the ticked ones
 *     - 清空全部: requires typing the confirmation word
 *  3. the running card must show a live 已用时 counter (the percentage is
 *     legitimately frozen while the provider gives no intermediate progress)
 *
 * Order matters: 清空全部 wipes everything, so it runs last.
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
const list = async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=40&offset=0`, { headers: H })).json()).data ?? []
const running = (t) => t.status === 'PENDING' || t.status === 'RUNNING'
const submit = async (ty, prompt) =>
  (
    await (
      await fetch(`${API}/v2/ai/generate/tasks`, {
        method: 'POST',
        headers: H,
        body: JSON.stringify({ type: ty, model: ty === 'video' ? 'agnes-video-2.5-flash' : 'agnes-image-2.5-flash', prompt, size: ty === 'video' ? '1280x720' : '1024x1024', duration: ty === 'video' ? 4 : undefined }),
      })
    ).json()
  ).data

console.log('=== 0. seed CANCELED records (the exact case that used to say "nothing to clean") ===')
for (const t of (await list('image')).filter(running)) {
  await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
}
for (let i = 0; i < 3; i++) {
  const t = await submit('image', `void seed ${Date.now()}-${i}`)
  await sleep(400)
  await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
}
await sleep(2500)
const seeded = (await list('image')).filter((t) => t.status === 'CANCELED').length
console.log(`  CANCELED rows now = ${seeded}`)
chk('there are CANCELED rows to clean', seeded > 0, String(seeded))

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
await sleep(3000)

console.log('\n=== 1. the badge number and the deletion must agree ===')
const badge = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.wg-chip')].find((c) => c.innerText.includes('清理'))
  if (!btn) return null
  btn.click()
  return btn.innerText.replace(/\s+/g, ' ').trim()
})
await sleep(900)
console.log(`  badge text = ${badge}`)
chk('the record-management popover opens', !!badge, badge ?? '(no button)')

const popover = await page.evaluate(() => {
  const popper = [...document.querySelectorAll('.el-popper, .wg-menu')].find((p) => p.offsetParent !== null)
  const scope = popper ?? document
  return [...scope.querySelectorAll('.wg-menu-item')].map((e) => e.innerText.replace(/\n+/g, ' / ').trim())
})
console.log(`  popover items = ${JSON.stringify(popover)}`)
chk('popover offers exactly the three actions', popover.length === 3, JSON.stringify(popover))
chk('popover has 清理失败', popover.some((t) => t.includes('清理失败')))
chk('popover has 批量删除', popover.some((t) => t.includes('批量删除')))
chk('popover has 清空全部', popover.some((t) => t.includes('清空全部')))
await page.screenshot({ path: `${SHOT}/fix-popover.png` })

console.log('\n=== 2. 清理失败 deletes whats in the badge (CANCELED included) ===')
// Collect toasts with an observer. Sampling body.innerText a few seconds later
// always misses them: ElMessage auto-dismisses in ~3s (this exact mistake has
// produced false failures repeatedly).
await page.evaluate(() => {
  window.__toasts = []
  const grab = () => {
    for (const e of document.querySelectorAll('.el-message')) {
      const t = e.innerText.trim()
      if (t && !window.__toasts.includes(t)) window.__toasts.push(t)
    }
  }
  new MutationObserver(grab).observe(document.body, { childList: true, subtree: true })
  window.__toastTimer = setInterval(grab, 100)
})
const badgeNum = Number((badge || '').match(/(\d+)/)?.[1] ?? 0)
console.log(`  badge=${badgeNum}, CANCELED on server=${seeded}`)
await page.evaluate(() => {
  const popper = [...document.querySelectorAll('.el-popper, .wg-menu')].find((p) => p.offsetParent !== null)
  const scope = popper ?? document
  const item = [...scope.querySelectorAll('.wg-menu-item')].find((e) => e.innerText.includes('清理失败'))
  item?.click()
})
await sleep(900)
const confirmText = await page.evaluate(() => document.querySelector('.el-message-box__message')?.innerText ?? '(no dialog)')
console.log(`  confirm dialog: ${confirmText}`)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.el-message-box__btns button')].find((b) => b.innerText.includes('清理'))
  btn?.click()
})
await sleep(4000)
const afterClean = (await list('image')).filter((t) => t.status === 'FAILED' || t.status === 'CANCELED').length
console.log(`  remaining FAILED+CANCELED on server = ${afterClean}`)
chk('清理失败 actually deletes them (not "nothing to clean")', afterClean === 0, `${afterClean} left`)
const toast = await page.evaluate(() => {
  clearInterval(window.__toastTimer)
  return (window.__toasts ?? []).join(' | ') || '(none)'
})
console.log(`  toast = ${toast}`)
chk('it reports a real count, not "nothing to clean"', /已清理/.test(toast), toast)

console.log('\n=== 3. 批量删除 deletes only the ticked records ===')
const beforeBatch = (await list('image')).length
console.log(`  server rows before = ${beforeBatch}`)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.wg-chip')].find((c) => c.innerText.includes('清理'))
  btn?.click()
})
await sleep(800)
await page.evaluate(() => {
  const popper = [...document.querySelectorAll('.el-popper, .wg-menu')].find((p) => p.offsetParent !== null)
  const scope = popper ?? document
  const item = [...scope.querySelectorAll('.wg-menu-item')].find((e) => e.innerText.includes('批量删除'))
  item?.click()
})
await sleep(900)
const selectUi = await page.evaluate(() => ({
  picks: document.querySelectorAll('.wg-pick').length,
  bar: [...document.querySelectorAll('.wg-chip')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()).filter((t) => /已选|全选|删除选中|退出/.test(t)),
}))
console.log(`  selection UI: picks=${selectUi.picks} bar=${JSON.stringify(selectUi.bar)}`)
chk('every card gets a tick box', selectUi.picks > 1, String(selectUi.picks))
chk('selection toolbar appears', selectUi.bar.some((t) => t.includes('已选')), JSON.stringify(selectUi.bar))
await page.screenshot({ path: `${SHOT}/fix-select-mode.png` })

// tick the first two cards by clicking them, then let Vue re-render before
// reading the class back (reading in the same evaluate sees the pre-render DOM)
await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.wg-card:not(.is-skeleton)')].slice(0, 2)
  cards.forEach((c) => c.click())
})
await sleep(800)
const picked = await page.evaluate(() => document.querySelectorAll('.wg-card.is-selected').length)
const pickedBar = await page.evaluate(() =>
  [...document.querySelectorAll('.wg-chip')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()).find((t) => t.includes('已选')) ?? '(none)',
)
console.log(`  selected = ${picked}   toolbar = ${pickedBar}`)
chk('clicking cards ticks them', picked === 2, `${picked} selected`)
chk('the toolbar reflects the selection', /已选 2/.test(pickedBar), pickedBar)

await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.wg-chip')].find((c) => c.innerText.includes('删除选中'))
  btn?.click()
})
await sleep(900)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.el-message-box__btns button')].find((b) => b.innerText.includes('删除'))
  btn?.click()
})
await sleep(4500)
const afterBatch = (await list('image')).length
console.log(`  server rows after = ${afterBatch} (expected ${beforeBatch - 2})`)
chk('批量删除 removes exactly the ticked ones', afterBatch === beforeBatch - 2, `${beforeBatch} -> ${afterBatch}`)
const exited = await page.evaluate(() => document.querySelectorAll('.wg-pick').length)
chk('selection mode exits after deleting', exited === 0, `${exited} pick boxes left`)

console.log('\n=== 4. 已用时 ticks while generating ===')
await page.click('.wg-media-btn')
await sleep(700)
await page.click('.wg-menu-item:has-text("图像")')
await sleep(1200)
const input = page.locator('.wg-input, [contenteditable="true"], textarea').last()
await input.click()
await page.keyboard.type('elapsed tick probe')
await sleep(500)
await page.keyboard.press('Enter')
const samples = []
for (let i = 0; i < 26; i++) {
  await sleep(1200)
  // Only look at the running card: a finished card has no .wg-stage-elapsed,
  // and index [0] across the whole page could belong to anything.
  const s = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.wg-card.is-running')][0]
    const el = card?.querySelector('.wg-stage-elapsed')
    return el ? el.innerText.trim() : null
  })
  if (s) {
    samples.push(s)
    if (samples.length >= 5) break
  }
}
console.log(`  已用时 samples: ${JSON.stringify(samples)}`)
const nums = samples.map((s) => Number(s.match(/(\d+)/)?.[1] ?? -1)).filter((n) => n >= 0)
chk('the running card shows 已用时', samples.length > 0, JSON.stringify(samples))
chk('the elapsed counter increases every second', nums.length >= 3 && nums.every((n, i) => i === 0 || n >= nums[i - 1]) && nums[nums.length - 1] >= nums[0] + 2, JSON.stringify(nums))

console.log('\n=== 5. 清空全部 requires the confirmation word ===')
await sleep(2000)
const beforeAll = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.wg-chip')].find((c) => c.innerText.includes('清理'))
  btn?.click()
})
await sleep(800)
await page.evaluate(() => {
  const popper = [...document.querySelectorAll('.el-popper, .wg-menu')].find((p) => p.offsetParent !== null)
  const scope = popper ?? document
  const item = [...scope.querySelectorAll('.wg-menu-item')].find((e) => e.innerText.includes('清空全部'))
  item?.click()
})
await sleep(1000)
const promptShown = await page.evaluate(() => ({
  msg: document.querySelector('.el-message-box__message')?.innerText ?? '',
  hasInput: !!document.querySelector('.el-message-box__input input, .el-message-box input'),
}))
console.log(`  prompt: ${JSON.stringify(promptShown)}`)
chk('清空全部 asks for a typed confirmation', promptShown.hasInput && /清空/.test(promptShown.msg), promptShown.msg.slice(0, 60))
await page.screenshot({ path: `${SHOT}/fix-clear-all.png` })

// wrong word must be refused
await page.evaluate(() => {
  const i = document.querySelector('.el-message-box__input input, .el-message-box input')
  if (i) {
    i.value = 'x'
    i.dispatchEvent(new Event('input', { bubbles: true }))
  }
})
await sleep(500)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.el-message-box__btns button')].find((b) => b.innerText.includes('清空'))
  btn?.click()
})
await sleep(1500)
const stillThere = await page.evaluate(() => document.querySelectorAll('.wg-card:not(.is-skeleton)').length)
console.log(`  after typing a wrong word: cards = ${stillThere} (was ${beforeAll})`)
chk('a wrong confirmation word does not delete anything', stillThere === beforeAll, `${beforeAll} -> ${stillThere}`)

// correct word
await page.evaluate(() => {
  const i = document.querySelector('.el-message-box__input input, .el-message-box input')
  if (i) {
    i.value = '清空'
    i.dispatchEvent(new Event('input', { bubbles: true }))
  }
})
await sleep(500)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.el-message-box__btns button')].find((b) => b.innerText.includes('清空'))
  btn?.click()
})
await sleep(5000)
const serverLeft = (await list('image')).length + (await list('video')).length
console.log(`  server rows after clearing = ${serverLeft}`)
chk('the right word clears everything', serverLeft === 0, `${serverLeft} left`)

console.log('\n=== 6. console health ===')
chk('no unexpected JS errors', jsErrs.filter((e) => !/403|Failed to load resource/.test(e)).length === 0, jsErrs.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
