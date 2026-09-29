// 验收：检索结果图片能真实渲染（此前的覆盖缺口）
//
// 之前只验了「检索页无加入图片库按钮」，从没验过结果图能不能显示，
// 于是 resolveThumb 漏掉 baseURL 与令牌这个缺陷一直没被发现。
//
// 同时新增「共享地址解析函数」的回归：底库面板与检索页必须给出同一种地址形态。
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

const imgReqs = []
page.on('response', (r) => {
  if (/image-search\/\d+\/image/.test(r.url())) {
    imgReqs.push({ url: r.url().replace(BASE, '').replace(/\?.*$/, ''), status: r.status() })
  }
})

async function waitLibReady(timeout = 40000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const ok = await page
      .evaluate(() => {
        const stat = document.querySelectorAll('.lib-stat').length
        const cell = document.querySelectorAll('.lib-cell').length
        return stat > 0 && cell > 0
      })
      .catch(() => false)
    if (ok) {
      await page.waitForTimeout(800)
      return true
    }
    await page.waitForTimeout(400)
  }
  return false
}

try {
  // ── 登录 ─────────────────────────────────────────────
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
            try {
              return JSON.parse(raw) || ''
            } catch {
              return raw.replace(/^"|"$/g, '')
            }
          }
        }
        return ''
      })
      .catch(() => '')
    if (token) break
  }
  check('登录成功', !!token)

  // ── 1. 底库面板的图片地址形态（对照组，已知正确）────────
  console.log('=== 1. 底库面板（对照组）===')
  await page.goto(`${BASE}/setting/image-library`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  check('面板就绪', await waitLibReady())
  const libImgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.lib-cell img')).map((i) => ({
      src: i.currentSrc || i.src,
      w: i.naturalWidth,
    }))
  )
  console.log(`  卡片 ${libImgs.length} 张，示例 src: ${(libImgs[0] || {}).src || '(无)'}`)
  check('底库面板地址含 /v2 前缀', libImgs.length > 0 && libImgs.every((i) => /\/v2\/image-search\//.test(i.src)),
    (libImgs[0] || {}).src || '')
  check('底库面板地址含令牌', libImgs.length > 0 && libImgs.every((i) => /x-oauth-token=/.test(i.src)))
  check('底库面板缩略图全部解码', libImgs.length > 0 && libImgs.every((i) => i.w > 0),
    `${libImgs.filter((i) => i.w > 0).length}/${libImgs.length}`)

  // ── 2. 检索页：上传查询图并检索 ─────────────────────────
  console.log('=== 2. 检索页 ===')
  await page.goto(`${BASE}/image-search`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(4000)
  console.log(`  URL: ${page.url()}`)

  // 取一张底库原图当查询图（走接口取字节，再喂给页面上的 file input）
  const srcId = await page.evaluate(async (tk) => {
    const r = await fetch('/v2/image-search/list?page=1&size=1', { headers: { 'x-oauth-token': tk } })
    const o = await r.json()
    const d = o.data || {}
    const items = (d.data || d).items || []
    return items.length ? items[0].id : null
  }, token)
  console.log(`  查询图用底库 id=${srcId}`)
  const buf = await page.evaluate(async ([tk, id]) => {
    const r = await fetch(`/v2/image-search/${id}/image`, { headers: { 'x-oauth-token': tk } })
    const b = await r.blob()
    const ab = await b.arrayBuffer()
    return Array.from(new Uint8Array(ab))
  }, [token, srcId])

  const input = page.locator('input[type="file"]').first()
  check('检索页有文件选择入口', (await input.count()) > 0)
  await input.setInputFiles({
    name: 'probe-query.png',
    mimeType: 'image/png',
    buffer: Buffer.from(buf),
  })
  await page.waitForTimeout(9000)

  // ── 3. 结果图片必须真实渲染 ─────────────────────────────
  console.log('=== 3. 结果图片渲染 ===')
  const resultImgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.is-card-media img, .is-card img, [class*="is-card"] img')).map((i) => ({
      src: i.currentSrc || i.src,
      w: i.naturalWidth,
      alt: i.alt,
    }))
  )
  console.log(`  结果卡片图 ${resultImgs.length} 张`)
  resultImgs.slice(0, 5).forEach((i) => console.log(`    w=${i.w}  ${i.src.slice(0, 110)}`))
  check('检索出结果', resultImgs.length > 0, `count=${resultImgs.length}`)
  if (resultImgs.length) {
    check('结果图地址含 /v2 前缀', resultImgs.every((i) => i.src.startsWith('data:') || /\/v2\/image-search\//.test(i.src)),
      resultImgs[0].src.slice(0, 80))
    check('结果图地址含令牌', resultImgs.every((i) => i.src.startsWith('data:') || /x-oauth-token=/.test(i.src)))
    const decoded = resultImgs.filter((i) => i.w > 0).length
    check('结果图全部真实解码（无裂图）', decoded === resultImgs.length, `${decoded}/${resultImgs.length}`)
  }

  // ── 4. 本次会话中取图请求不得出现 4xx/5xx ───────────────
  console.log('=== 4. 取图请求状态 ===')
  const bad = imgReqs.filter((r) => r.status >= 400)
  console.log(`  取图请求 ${imgReqs.length} 次，异常 ${bad.length} 次`)
  bad.slice(0, 5).forEach((r) => console.log(`    [${r.status}] ${r.url}`))
  check('取图请求无 4xx/5xx', bad.length === 0, bad.length ? JSON.stringify(bad.slice(0, 3)) : 'clean')

  try {
    writeFileSync(
      'D:/ch/project/.run/deploy/pw-shots-lib/search-result-render.png',
      await page.screenshot({ fullPage: false })
    )
  } catch {
    /* 截图失败不影响判定 */
  }
} catch (e) {
  console.log('  [FAIL] 脚本异常: ' + e.message)
  fail++
} finally {
  await browser.close()
}

console.log('')
console.log(`RESULT ${pass}/${pass + fail} PASSED`)
if (fail > 0) process.exitCode = 1
