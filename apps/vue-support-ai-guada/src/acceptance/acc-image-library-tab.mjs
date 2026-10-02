// 验收：设置中心 → 图片库 独立 tab
import { chromium } from 'playwright'

const BASE = process.env.AI_ACCEPT_BASE || 'http://localhost:15689'
const USER = process.env.AI_ACCEPT_USER || 'admin'
const PASS = process.env.AI_ACCEPT_PASS

if (!PASS) {
  console.error('缺少 AI_ACCEPT_PASS')
  process.exit(2)
}

let pass = 0
let fail = 0
const check = (name, ok, detail = '') => {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -> ' + detail : ''}`)
  ok ? pass++ : fail++
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

const jsErrors = []
const failedReqs = []
page.on('pageerror', (e) => jsErrors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') jsErrors.push('[console] ' + m.text())
})
page.on('response', (r) => {
  if (r.status() >= 400) failedReqs.push(`[${r.status()}] ${r.request().method()} ${r.url()}`)
})

try {
  // 登录
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('input[type="text"]').first().waitFor({ timeout: 20000 })
  await page.locator('input[type="text"]').first().fill(USER)
  await page.locator('input[type="password"]').first().fill(PASS)
  await page.locator('input[type="password"]').first().press('Enter')

  let token = ''
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500)
    token = await page.evaluate(() => {
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
    }).catch(() => '')
    if (token) break
  }
  check('登录成功', !!token, `len=${token.length}`)

  // 1. 设置中心左侧有「图片库」菜单项
  await page.goto(`${BASE}/setting/general`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3500)
  const sidebar = await page.locator('body').innerText()
  check('侧边栏出现「图像底库」', sidebar.includes('图像底库'))

  // 2. 点击能切到该 tab
  const libItem = page.locator('text=图像底库').first()
  const hasItem = (await libItem.count()) > 0
  check('「图像底库」菜单可点击', hasItem)
  if (hasItem) {
    await libItem.click()
    await page.waitForTimeout(2500)
    check('URL 切到 image-library', page.url().includes('image-library'), page.url())
  }

  // 3. 底库面板真实渲染（UI 改版后根节点是 .lib-page）
  const panel = page.locator('.lib-page')
  const count = await panel.count()
  check('图像底库面板存在', count > 0, `count=${count}`)
  if (count > 0) {
    const box = await panel.first().boundingBox()
    check('面板真实可见（有宽高）', !!box && box.width > 200 && box.height > 200,
      box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'null')
  }

  // 4. 底库内容在
  const txt = await page.locator('body').innerText()
  check('出现「上传图片」按钮', txt.includes('上传图片'))
  check('出现拖拽上传区', txt.includes('把图片拖到这里'))
  check('显示底库条数', /共\s*\d+\s*张/.test(txt), (txt.match(/共\s*\d+\s*张/) || [''])[0])

  // 5. 缩略图真的解码出来了
  const imgs = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('.lib-page .lib-cell img'))
    return {
      total: list.length,
      decoded: list.filter((i) => i.naturalWidth > 0).length
    }
  })
  check('缩略图全部真实解码', imgs.total > 0 && imgs.total === imgs.decoded,
    `${imgs.decoded}/${imgs.total}`)

  // 6. 「默认模型」里不再有图片库（已提为独立 tab，避免两处入口）
  await page.goto(`${BASE}/setting/default-models`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(3000)
  const dm = await page.locator('body').innerText()
  const dmSlot = await page.locator('.lib-slot').count()
  check('默认模型页已无重复的图像底库入口', dmSlot === 0, `lib-slot=${dmSlot}`)
  check('默认模型页仍能读到 image_search 配置', dm.includes('图像特征模型') || dm.includes('default_image_feature_model'))

  // 7. 页面错误
  const isNoise = (s) =>
    /weather-api|ERR_ABORTED/.test(s) ||
    /登录失败/.test(s) ||
    /events\/sessions/.test(s) ||
    /Failed to load resource: the server responded with a status of 404/.test(s)
  const mineErrs = jsErrors.filter((e) => !isNoise(e))
  const mineReqs = failedReqs.filter((u) => !/weather-api|events\/sessions/.test(u))
  check('业务相关 0 JS 错误', mineErrs.length === 0, mineErrs.length ? mineErrs.join(' | ') : 'clean')
  check('业务相关 0 失败请求', mineReqs.length === 0, mineReqs.length ? mineReqs.join(' | ') : 'clean')

  try {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(
      'D:/ch/project/.run/deploy/pw-shots-lib/image-library-tab.png',
      await page.screenshot({ fullPage: false })
    )
  } catch {
    // 截图目录不存在不影响判定
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
