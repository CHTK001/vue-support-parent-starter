// 验收：检索页三项改造
//   ① 空态与有结果版面一致（统计条不消失、空态占位尺寸一致）
//   ② 查询图与结果图都能用 viewerjs 放大
//   ③ 显示检索耗时
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const BASE = process.env.AI_ACCEPT_BASE || 'http://localhost:15689'
const PASS = process.env.AI_ACCEPT_PASS || 'admin123'

let pass = 0
let fail = 0
const check = (n, ok, d = '') => {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${n}${d ? ' -> ' + d : ''}`)
  ok ? pass++ : fail++
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

async function login() {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('input[type="text"]').first().waitFor({ timeout: 20000 })
  await page.locator('input[type="text"]').first().fill('admin')
  await page.locator('input[type="password"]').first().fill(PASS)
  await page.locator('input[type="password"]').first().press('Enter')
  let token = ''
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500)
    token = await page
      .evaluate(() => {
        for (let j = 0; j < localStorage.length; j++) {
          const k = localStorage.key(j)
          if (/accessToken/i.test(k)) {
            const raw = localStorage.getItem(k) || ''
            try { return JSON.parse(raw) || '' } catch { return raw.replace(/^"|"$/g, '') }
          }
        }
        return ''
      })
      .catch(() => '')
    if (token) break
  }
  return token
}

const snap = () =>
  page.evaluate(() => ({
    footbar: !!document.querySelector('.is-footbar'),
    footItems: document.querySelectorAll('.is-footbar-item').length,
    footText: (document.querySelector('.is-footbar')?.textContent || '').replace(/\s+/g, ' ').trim(),
    empty: !!document.querySelector('.is-empty'),
    emptyH: Math.round(document.querySelector('.is-empty')?.getBoundingClientRect().height || 0),
    gridH: Math.round(document.querySelector('.is-grid')?.getBoundingClientRect().height || 0),
    sideH: Math.round(document.querySelector('.is-side')?.getBoundingClientRect().height || 0),
    cards: document.querySelectorAll('.is-card').length,
    resultTip: (document.querySelector('.is-result-tip')?.textContent || '').replace(/\s+/g, ' ').trim(),
  }))

try {
  const token = await login()
  check('登录成功', !!token)

  await page.goto(`${BASE}/image-search`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)

  // ── ① 未检索时的空态版面 ─────────────────────────────
  console.log('=== 1. 未检索（空态）===')
  const idle = await snap()
  console.log(`  ${JSON.stringify(idle)}`)
  check('空态显示提示', idle.empty)
  check('统计条已渲染（不是整块消失）', idle.footbar, `items=${idle.footItems}`)
  check('统计条含 4 项（命中/最高/均值/耗时）', idle.footItems === 4, `count=${idle.footItems}`)
  check('未检索时各项为「—」', /命中：—/.test(idle.footText) && /耗时：—/.test(idle.footText), idle.footText)

  // ── 上传查询图并检索 ────────────────────────────────
  console.log('=== 2. 检索 ===')
  const srcId = await page.evaluate(async (tk) => {
    const r = await fetch('/v2/image-search/list?page=1&size=1', { headers: { 'x-oauth-token': tk } })
    const o = await r.json()
    const d = o.data || {}
    return (((d.data || d).items) || [])[0]?.id ?? null
  }, token)
  const buf = await page.evaluate(async ([tk, id]) => {
    const r = await fetch(`/v2/image-search/${id}/image`, { headers: { 'x-oauth-token': tk } })
    return Array.from(new Uint8Array(await (await r.blob()).arrayBuffer()))
  }, [token, srcId])

  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'probe-query.png', mimeType: 'image/png', buffer: Buffer.from(buf),
  })
  await page.waitForTimeout(10000)

  const hit = await snap()
  console.log(`  ${JSON.stringify(hit)}`)
  check('检索出结果卡片', hit.cards > 0, `cards=${hit.cards}`)
  check('有结果时统计条仍在', hit.footbar)

  // ── ③ 检索耗时 ──────────────────────────────────────
  console.log('=== 3. 检索耗时 ===')
  const costMatch = hit.footText.match(/耗时：(\d+)\s*ms/)
  check('统计条显示耗时为具体数字', !!costMatch, hit.footText)
  if (costMatch) {
    const ms = Number(costMatch[1])
    check('耗时为正数且合理（1ms~120s）', ms >= 1 && ms <= 120000, `${ms} ms`)
  }
  check('结果提示也带耗时', /耗时\s*\d+\s*ms/.test(hit.resultTip), hit.resultTip)

  // ── ① 版面一致性：空态 vs 有结果 ─────────────────────
  console.log('=== 4. 空态与有结果版面一致 ===')
  // 把相似度筛选调到不可能命中，制造「有查询图但无结果」的空态
  await page.locator('.is-chip', { hasText: '≥ 90%' }).first().click().catch(() => {})
  await page.waitForTimeout(1500)
  const filtered = await snap()
  console.log(`  ${JSON.stringify(filtered)}`)
  check('筛选后仍保留统计条结构', filtered.footbar && filtered.footItems === 4)
  // 关键：统计条存在 → 侧栏高度不会突降；空态占位高度与网格量级相当
  check('空态有足够占位高度（不塌陷）', !filtered.empty || filtered.emptyH >= 200,
    `emptyH=${filtered.emptyH} gridH=${filtered.gridH}`)
  check('侧栏高度未因无结果而塌陷', filtered.sideH >= 300, `sideH=${filtered.sideH}`)
  // 恢复筛选
  await page.locator('.is-chip', { hasText: '全部' }).first().click().catch(() => {})
  await page.waitForTimeout(1200)

  // ── ② viewerjs 放大 ─────────────────────────────────
  console.log('=== 5. viewerjs 放大 ===')
  const qImg = page.locator('.is-canvas img.is-img').first()
  check('查询图存在', (await qImg.count()) > 0)
  await qImg.click()
  await page.waitForTimeout(1500)
  const qv = await page.evaluate(() => ({
    container: !!document.querySelector('.viewer-container'),
    visible: !!document.querySelector('.viewer-container.viewer-in'),
    decoded: (() => { const i = document.querySelector('.viewer-canvas img'); return i ? i.naturalWidth : 0 })(),
    zoomBtn: !!document.querySelector('.viewer-zoom-in'),
  }))
  check('查询图 viewerjs 已打开', qv.container && qv.visible, JSON.stringify(qv))
  check('查询图大图已解码', qv.decoded > 0, `naturalWidth=${qv.decoded}`)
  check('有放大按钮（可点开放大）', qv.zoomBtn)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  check('Esc 可关闭', !(await page.evaluate(() => !!document.querySelector('.viewer-container.viewer-in'))))

  const cardImg = page.locator('.is-card-media img').first()
  check('结果图存在', (await cardImg.count()) > 0)
  await cardImg.click()
  await page.waitForTimeout(1800)
  const rv = await page.evaluate(() => ({
    visible: !!document.querySelector('.viewer-container.viewer-in'),
    decoded: (() => { const i = document.querySelector('.viewer-canvas img'); return i ? i.naturalWidth : 0 })(),
    navbar: document.querySelectorAll('.viewer-navbar li').length,
    caption: (document.querySelector('.viewer-title')?.textContent || '').trim(),
  }))
  check('结果图 viewerjs 已打开', rv.visible, JSON.stringify(rv))
  check('结果图大图已解码', rv.decoded > 0, `naturalWidth=${rv.decoded}`)
  check('多图时有缩略导航（可左右切换）', rv.navbar >= 1, `navbar=${rv.navbar}`)

  try {
    writeFileSync('D:/ch/project/.run/deploy/pw-shots-lib/search-viewer.png', await page.screenshot({ fullPage: false }))
  } catch { /* 截图失败不影响判定 */ }
} catch (e) {
  console.log('  [FAIL] 脚本异常: ' + e.message)
  fail++
} finally {
  await browser.close()
}

console.log('')
console.log(`RESULT ${pass}/${pass + fail} PASSED`)
if (fail > 0) process.exitCode = 1
