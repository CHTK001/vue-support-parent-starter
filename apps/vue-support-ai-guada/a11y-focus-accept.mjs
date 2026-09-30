/**
 * Verify the keyboard focus ring actually renders on the page's controls.
 *
 * Method: focus each control with the keyboard (Tab) and read back the computed
 * outline. A rule that exists in CSS but is overridden by Element Plus, or that
 * never matches because the element isn't focusable, would pass a code review and
 * fail here - which is why this is measured instead of eyeballed.
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
const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.setDefaultTimeout(60000)
await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await sleep(700)
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await sleep(4000)
await page.goto(`${FE}/image-generate`, { waitUntil: 'domcontentloaded' })
// 等控件真出现再取样，不靠固定秒数 —— 固定等待在挂载慢或中途跳登录时会静默取空，
// 于是把「页面没加载」误报成「焦点环没做」。
await page.waitForSelector('.wg-media-btn', { timeout: 30000 })
await sleep(800)

// 逐个用焦点 API 聚焦（等价于键盘到达），读计算样式里的 outline
const probe = async (selector, label) => {
  const r = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { found: false }
    el.focus()
    const cs = getComputedStyle(el)
    return {
      found: true,
      focused: document.activeElement === el,
      style: cs.outlineStyle,
      width: cs.outlineWidth,
      color: cs.outlineColor,
    }
  }, selector)
  const ok = r.found && r.focused && r.style !== 'none' && parseFloat(r.width) >= 2
  chk(`${label} has a visible focus ring`, ok, JSON.stringify(r))
}

console.log('=== 键盘焦点环（skill CRITICAL 项）===')
await probe('.wg-media-btn', '类型切换按钮')
await probe('.wg-search-input', '搜索框')
await probe('.wg-chip', '工具条芯片')
await probe('.wg-view', '视图切换')
const hasMoreBtn = await page.evaluate(() => !!document.querySelector('.wg-more-btn'))
if (hasMoreBtn) {
  await probe('.wg-more-btn', '加载更多')
} else {
  console.log('  NOTE  没有分页页脚（记录数不足一页），「加载更多」无从验证（不判红）')
}

// 卡片内的图标按钮需要卡片先渲染（结果图为空时可能没有）
const hasThumb = await page.evaluate(() => !!document.querySelector('.wg-icon'))
console.log(`  卡片图标按钮存在: ${hasThumb}`)
if (hasThumb) {
  await probe('.wg-icon', '卡片图标按钮')
} else {
  console.log('  NOTE  页面上没有结果图卡片，卡片内图标按钮无法验证（不判红）')
}

console.log('\n=== 焦点环不得挤动布局（outline 不占位）===')
const noShift = await page.evaluate(() => {
  const el = document.querySelector('.wg-media-btn')
  if (!el) return null
  const before = el.getBoundingClientRect()
  el.focus()
  const after = el.getBoundingClientRect()
  return { w: before.width === after.width && before.height === after.height }
})
chk('focus does not change the element box', noShift?.w === true, JSON.stringify(noShift))

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
