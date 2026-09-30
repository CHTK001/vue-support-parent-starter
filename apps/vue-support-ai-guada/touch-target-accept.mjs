/**
 * Verify the coarse-pointer hit areas: >=44x44 AND no neighbour stealing clicks.
 *
 * Emulating touch is not enough on its own - first assert that the media query
 * actually matches under this emulation, otherwise the whole run would silently
 * measure the desktop layout and "pass".
 *
 * The property that matters is not "the box is 44px" but "a tap near the edge of
 * target N still resolves to N". So each check uses elementFromPoint.
 */
import { chromium } from 'playwright'

const FE = 'http://localhost:15689'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pass = []
const fail = []
const chk = (n, ok, extra = '') => {
  ;(ok ? pass : fail).push(n)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? '  ' + extra : ''}`)
}

const browser = await chromium.launch()
// 桌面宽度 + 触屏模拟：手机宽度（390）下侧栏是浮层、盖住内容区，
// elementFromPoint 会全打在侧栏上，量到的不是被测控件（这是取样错误，不是样式问题）。
// 宽度 >=1024 时侧栏归位到左侧占位，内容区可正常取样。
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: true })
const page = await ctx.newPage()
page.setDefaultTimeout(60000)
await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await sleep(700)
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await sleep(4000)
await page.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.wg-media-btn', { timeout: 30000 })
await sleep(800)

console.log('=== 0. 先确认媒体查询真的命中（否则量的是桌面版式，会假通过）===')
const coarse = await page.evaluate(() => ({
  coarse: matchMedia('(pointer: coarse)').matches,
  fine: matchMedia('(pointer: fine)').matches,
  width: innerWidth,
}))
console.log(`  ${JSON.stringify(coarse)}`)
chk('pointer: coarse 已匹配', coarse.coarse === true, JSON.stringify(coarse))

console.log('\n=== 1. 热区是否达到 44×44（以 chip 为例，用 elementFromPoint 量边缘）===')
const chip = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.wg-chip')].find((c) => c.offsetParent !== null)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const own = (x, y) => {
    const hit = document.elementFromPoint(x, y)
    return hit === el || el.contains(hit)
  }
  return {
    box: `${Math.round(r.width)}x${Math.round(r.height)}`,
    // 中心上下各 21px（44 的一半）仍应命中自己
    upOk: own(cx, cy - 21),
    downOk: own(cx, cy + 21),
    leftOk: own(cx - 21, cy),
    rightOk: own(cx + 21, cy),
  }
})
console.log(`  chip 视觉盒 ${chip?.box}，±21px 命中自检: ${JSON.stringify(chip)}`)
chk('热区向上延伸到 44px', chip?.upOk === true, `up=${chip?.upOk}`)
chk('热区向下延伸到 44px', chip?.downOk === true, `down=${chip?.downOk}`)
chk('热区向左延伸到 44px', chip?.leftOk === true, `left=${chip?.leftOk}`)
chk('热区向右延伸到 44px', chip?.rightOk === true, `right=${chip?.rightOk}`)

console.log('\n=== 2. 相邻控件互不截胡：每个控件的中心仍命中自己 ===')
const noSteal = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('.wg-chip')].filter((c) => c.offsetParent !== null)
  const bad = []
  for (const el of chips) {
    const r = el.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    if (!(hit === el || el.contains(hit))) {
      bad.push(`${el.innerText.trim().slice(0, 8)} -> 被 ${hit?.className ?? '?'} 截胡`)
    }
  }
  return { count: chips.length, bad }
})
console.log(`  检查 ${noSteal.count} 个芯片，被截胡 ${noSteal.bad.length} 个`)
noSteal.bad.slice(0, 4).forEach((b) => console.log(`    ${b}`))
chk('可见控件都没有被相邻热区截胡', noSteal.bad.length === 0, JSON.stringify(noSteal.bad.slice(0, 3)))

console.log('\n=== 3. 间距已按粗指针放大（给热区留位置）===')
const gaps = await page.evaluate(() => {
  const g = (sel) => {
    const el = document.querySelector(sel)
    return el ? getComputedStyle(el).gap : null
  }
  return { headActions: g('.wg-head-actions'), cardHeadRight: g('.wg-card-head-right'), thumbActions: g('.wg-thumb-actions') }
})
console.log(`  ${JSON.stringify(gaps)}`)
chk('工具条间距已放大到 >=14px', gaps.headActions !== null && parseFloat(gaps.headActions) >= 14, String(gaps.headActions))

console.log('\n=== 4. 桌面（细指针）版式不受影响 ===')
const fine = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const finePage = await fine.newPage()
finePage.setDefaultTimeout(60000)
await finePage.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await finePage.waitForSelector("input[type='text']")
await sleep(700)
await finePage.fill("input[type='text']", 'admin')
await finePage.fill("input[type='password']", 'admin123')
await finePage.click('button.flex')
await sleep(4000)
await finePage.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
await finePage.waitForSelector('.wg-media-btn', { timeout: 30000 })
await sleep(600)
const fineGaps = await finePage.evaluate(() => ({
  fine: matchMedia('(pointer: fine)').matches,
  gap: getComputedStyle(document.querySelector('.wg-head-actions')).gap,
}))
console.log(`  ${JSON.stringify(fineGaps)}`)
chk('细指针下间距保持原值 10px（版式不变）', fineGaps.gap === '10px', fineGaps.gap)

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
