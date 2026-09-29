// 前端生产级验收（此前只覆盖后端，这一套补前端维度）
//
// 关注点不是"功能对不对"，而是"上生产会不会出事"：
//   ① 窄屏/小视口不破版（真实用户会用笔记本一半屏宽）
//   ② 暗色主题可用（亮色不是唯一主题）
//   ③ 反复开关 viewer 不泄漏（viewerjs 实例必须销毁）
//   ④ 反复检索/切页不堆积监听与错误
//   ⑤ 控制台无业务错误
//   ⑥ 首屏可交互时间
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

const errors = []
const reqFails = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('[console] ' + m.text())
})
page.on('response', (r) => {
  if (r.status() >= 400) reqFails.push(`[${r.status()}] ${r.request().method()} ${r.url().replace(BASE, '')}`)
})

const isNoise = (s) =>
  /weather-api|ERR_ABORTED/.test(s) ||
  /登录失败/.test(s) ||
  /events\/sessions/.test(s) ||
  /Failed to load resource: the server responded with a status of 404/.test(s)

try {
  // ── 登录 ─────────────────────────────────────────────
  const t0 = Date.now()
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
  check('登录成功', !!token, `${Date.now() - t0} ms`)

  // ── ① 首屏可交互时间 ────────────────────────────────
  console.log('=== 1. 首屏性能 ===')
  const nav = await page.evaluate(() => {
    const e = performance.getEntriesByType('navigation')[0]
    return e ? { dom: Math.round(e.domContentLoadedEventEnd), load: Math.round(e.loadEventEnd) } : null
  })
  console.log(`  navigation: ${JSON.stringify(nav)}`)
  const libStart = Date.now()
  await page.goto(`${BASE}/setting/image-library`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  for (let i = 0; i < 60; i++) {
    const ok = await page.evaluate(() => document.querySelectorAll('.lib-cell').length > 0).catch(() => false)
    if (ok) break
    await page.waitForTimeout(500)
  }
  const libReady = Date.now() - libStart
  check('图像底库首屏可交互 < 20s', libReady < 20000, `${libReady} ms`)

  // ── ② 窄屏不破版 ────────────────────────────────────
  console.log('=== 2. 窄屏（1280×720）===')
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(2000)
  const narrow = await page.evaluate(() => {
    const de = document.documentElement
    return {
      hasHorizontalScroll: de.scrollWidth - de.clientWidth > 2,
      overflowPx: de.scrollWidth - de.clientWidth,
      cells: document.querySelectorAll('.lib-cell').length,
      stats: document.querySelectorAll('.lib-stat').length,
    }
  })
  console.log(`  ${JSON.stringify(narrow)}`)
  check('窄屏不出现横向滚动条', !narrow.hasHorizontalScroll, `overflow=${narrow.overflowPx}px`)
  check('窄屏统计卡与网格仍在', narrow.stats === 4 && narrow.cells > 0)

  // ── ③ 检索页窄屏 ────────────────────────────────────
  await page.goto(`${BASE}/image-search`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)
  const narrowSearch = await page.evaluate(() => {
    const de = document.documentElement
    return {
      overflow: de.scrollWidth - de.clientWidth,
      footbar: !!document.querySelector('.is-footbar'),
      side: !!document.querySelector('.is-side'),
    }
  })
  console.log(`  ${JSON.stringify(narrowSearch)}`)
  check('检索页窄屏无横向滚动', narrowSearch.overflow <= 2, `overflow=${narrowSearch.overflow}px`)
  check('检索页窄屏统计条仍在', narrowSearch.footbar)
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.waitForTimeout(1200)

  // ── ④ 暗色主题 ──────────────────────────────────────
  console.log('=== 3. 暗色主题 ===')
  /** 相对亮度，用于判断深浅与对比度（WCAG 近似式） */
  const lum = (rgb) => {
    const m = String(rgb || '').match(/(\d+),\s*(\d+),\s*(\d+)/)
    return m ? (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255 : null
  }
  const readTheme = () =>
    page.evaluate(() => {
      const root = document.querySelector('.is-root') || document.body
      const cs = getComputedStyle(root)
      const textEl = document.querySelector('.is-empty-title') || document.querySelector('.is-side') || root
      return {
        dark: document.documentElement.classList.contains('dark'),
        bg: cs.backgroundColor,
        color: getComputedStyle(textEl).color,
      }
    })

  const lightTheme = await readTheme()
  console.log(`  light: bg=${lightTheme.bg} color=${lightTheme.color}`)
  check('亮色：页面实体面为浅色', (lum(lightTheme.bg) ?? -1) > 0.7, `L=${lum(lightTheme.bg)?.toFixed(3)}`)
  check('亮色：文字与底色对比充分', Math.abs((lum(lightTheme.bg) ?? 0) - (lum(lightTheme.color) ?? 0)) > 0.5)

  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(1500)
  const darkTheme = await readTheme()
  console.log(`  dark:  bg=${darkTheme.bg} color=${darkTheme.color}`)
  check('暗色模式样式已应用', darkTheme.dark)
  // 关键：暗色必须真的变深，且不是透明穿透（透明会把浅色父层透出来）
  check('暗色：页面实体面为深色', (lum(darkTheme.bg) ?? 1) < 0.3, `L=${lum(darkTheme.bg)?.toFixed(3)}`)
  check('暗色：面不透明（未穿透）', !/rgba\(0,\s*0,\s*0,\s*0\)/.test(darkTheme.bg), darkTheme.bg)
  check('暗色：文字与底色对比充分', Math.abs((lum(darkTheme.bg) ?? 0) - (lum(darkTheme.color) ?? 0)) > 0.5,
    `ΔL=${Math.abs((lum(darkTheme.bg) ?? 0) - (lum(darkTheme.color) ?? 0)).toFixed(3)}`)
  await page.evaluate(() => document.documentElement.classList.remove('dark'))

  // ── ⑤ viewerjs 反复开关不泄漏 ───────────────────────
  console.log('=== 4. viewerjs 反复开关 ===')
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
    name: 'pt.png', mimeType: 'image/png', buffer: Buffer.from(buf),
  })
  await page.waitForTimeout(9000)

  for (let round = 0; round < 5; round++) {
    const img = page.locator('.is-card-media img').first()
    if (!(await img.count())) break
    await img.click()
    await page.waitForTimeout(700)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }
  const containerCount = await page.evaluate(() => document.querySelectorAll('.viewer-container').length)
  check('5 轮开关后只留 1 个 viewer 容器（无实例泄漏）', containerCount <= 1, `containers=${containerCount}`)
  const stillIn = await page.evaluate(() => !!document.querySelector('.viewer-container.viewer-in'))
  check('5 轮后 viewer 已关闭', !stillIn)

  // ── ⑥ 反复切页不堆积错误 ────────────────────────────
  console.log('=== 5. 反复切页 ===')
  for (let i = 0; i < 3; i++) {
    await page.goto(`${BASE}/setting/image-library`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2500)
    await page.goto(`${BASE}/image-search`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2500)
  }
  const mineErrs = errors.filter((e) => !isNoise(e))
  const mineReqs = reqFails.filter((u) => !/weather-api|events\/sessions/.test(u))
  console.log(`  累计 console 错误 ${errors.length} 条（业务相关 ${mineErrs.length}）`)
  mineErrs.slice(0, 4).forEach((e) => console.log(`    ${e.slice(0, 130)}`))
  console.log(`  累计失败请求 ${reqFails.length} 次（业务相关 ${mineReqs.length}）`)
  mineReqs.slice(0, 4).forEach((e) => console.log(`    ${e}`))
  check('反复切页后无业务 console 错误', mineErrs.length === 0, mineErrs.length ? `${mineErrs.length} 条` : 'clean')
  check('反复切页后无业务失败请求', mineReqs.length === 0, mineReqs.length ? `${mineReqs.length} 次` : 'clean')

  try {
    writeFileSync('D:/ch/project/.run/deploy/pw-shots-lib/prodgrade-frontend.png', await page.screenshot({ fullPage: false }))
  } catch { /* 忽略 */ }
} catch (e) {
  console.log('  [FAIL] 脚本异常: ' + e.message)
  fail++
} finally {
  await browser.close()
}

console.log('')
console.log(`RESULT ${pass}/${pass + fail} PASSED`)
if (fail > 0) process.exitCode = 1
