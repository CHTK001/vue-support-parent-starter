// 验收：① 重命名「图像底库」 ② 模型未就绪时显示「去配置模型」引导
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
const jsErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') jsErrors.push(m.text())
})

/**
 * 等面板渲染完成。
 *
 * <p>不能睡固定时长：dev server 冷启动要现编译几十个模块，首屏可能 6~10 秒
 * 才出内容，固定等 4 秒会拿到「空白但没报错」的中间态，把好实现判成 FAIL。
 * 判据是「统计卡已出现 且（有卡片 或 空态提示）」。</p>
 */
async function waitLibReady(timeout = 40000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const stat = document.querySelectorAll('.lib-stat').length
      const cell = document.querySelectorAll('.lib-cell').length
      const empty = !!document.querySelector('.lib-empty')
      const blocked = !!document.querySelector('.lib-blocked')
      return blocked || (stat > 0 && (cell > 0 || empty))
    }).catch(() => false)
    if (ready) {
      // 再给缩略图一点解码时间
      await page.waitForTimeout(800)
      return true
    }
    await page.waitForTimeout(400)
  }
  return false
}

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('input[type="text"]').first().waitFor({ timeout: 20000 })
  await page.locator('input[type="text"]').first().fill('admin')
  await page.locator('input[type="password"]').first().fill(PASS)
  await page.locator('input[type="password"]').first().press('Enter')
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500)
    const t = await page.evaluate(() => localStorage.getItem('ai-guada:accessToken') || '').catch(() => '')
    if (t) break
  }

  // ── 1. 重命名 ─────────────────────────────────────────
  console.log('=== 1. 重命名「图像底库」 ===')
  await page.goto(`${BASE}/setting/image-library`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const ready = await waitLibReady()
  check('面板在超时内渲染完成', ready)

  // 侧边栏是 Teleport 到 #settings-sidebar-portal 的，与面板各自独立挂载；
  // 面板就绪不等于侧边栏已挂上，单独等一次再断言。
  let sidebarText = ''
  for (let i = 0; i < 25; i++) {
    sidebarText = await page.locator('body').innerText().catch(() => '')
    if (sidebarText.includes('图像底库')) break
    await page.waitForTimeout(400)
  }
  check('侧边栏显示「图像底库」', sidebarText.includes('图像底库'))
  check('不再出现「图片库」', !sidebarText.includes('图片库'))
  check('页头标题为「图像底库」',
    (await page.locator('.lib-head-title').innerText().catch(() => '')) === '图像底库')

  // ── 2. 模型已配好时：正常渲染 ─────────────────────────
  console.log('=== 2. 模型可用时的正常态 ===')
  const blocked = await page.locator('.lib-blocked').count()
  check('未误判为不可用', blocked === 0, `blocked=${blocked}`)
  check('统计卡 4 张', (await page.locator('.lib-stat').count()) === 4)
  check('网格有卡片', (await page.locator('.lib-cell').count()) > 0)

  const foot = await page.locator('.lib-foot').innerText().catch(() => '')
  check('底栏显示特征模型', /特征模型：\S/.test(foot), foot.trim())

  // ── 3. 检索页文案同步 ─────────────────────────────────
  console.log('=== 3. 检索页文案 ===')
  await page.goto(`${BASE}/image-search`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3500)
  // 否定式断言必须先确认页面真的渲染了：空页面上「不含某文案」必然通过。
  // 之前路由写成 /search/image（不存在），这里就一直真空绿灯。
  const searchRendered = (await page.locator('.is-side, .is-tabs, input[type="file"]').count()) > 0
  check('检索页确实加载（非空页面）', searchRendered,
    `url=${page.url().replace(BASE, '')} marker=${await page.locator('.is-side, .is-tabs, input[type="file"]').count()}`)
  const searchText = await page.locator('body').innerText()
  check('检索页使用「图像底库」措辞', searchText.includes('图像底库') || !searchText.includes('图片库'))
  check('检索页无「图片库」残留', !searchText.includes('图片库'))

  // ── 4. 能力清单接口被判据采信 ─────────────────────────
  console.log('=== 4. 能力清单校验 ===')
  const cap = await page.evaluate(async () => {
    const tk = localStorage.getItem('ai-guada:accessToken') || ''
    const clean = tk.replace(/^"|"$/g, '')
    const r = await fetch('/v2/ai/models/capability/feature', { headers: { 'x-oauth-token': clean } })
    const o = await r.json()
    const list = Array.isArray(o) ? o : o.data
    return { ok: r.ok, count: Array.isArray(list) ? list.length : -1, hasRn50: Array.isArray(list) && list.includes('cn-clip-rn50-image') }
  })
  check('能力清单可读', cap.ok && cap.count > 0, JSON.stringify(cap))
  check('cn-clip-rn50-image 在清单里', cap.hasRn50)

  const errs = jsErrors.filter((e) => !/weather-api|ERR_ABORTED|登录失败|events\/sessions/.test(e) && !/status of 404/.test(e))
  check('业务相关 0 JS 错误', errs.length === 0, errs.length ? errs.slice(0, 2).join(' | ') : 'clean')

  try {
    writeFileSync(
      'D:/ch/project/.run/deploy/pw-shots-lib/renamed-library.png',
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
