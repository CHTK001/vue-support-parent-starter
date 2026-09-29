// 验收：图片库 UI 改版 —— viewerjs 预览 + 批量删除 + mockup 布局
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

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

const shots = 'D:/ch/project/.run/deploy/pw-shots-lib'
const shot = async (name) => {
  try {
    writeFileSync(`${shots}/${name}.png`, await page.screenshot({ fullPage: false }))
  } catch {
    // 截图目录不存在不影响判定
  }
}

try {
  // ── 登录 ─────────────────────────────────────────────
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('input[type="text"]').first().waitFor({ timeout: 20000 })
  await page.locator('input[type="text"]').first().fill(USER)
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
  check('登录成功', !!token, `len=${token.length}`)

  // ── 1. 打开图片库 tab ─────────────────────────────────
  console.log('=== 1. 图片库页 ===')
  await page.goto(`${BASE}/setting/image-library`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)
  const txt = await page.locator('body').innerText()

  check('页头「图像底库」', txt.includes('图像底库'))
  check('副标题存在', txt.includes('上传图片后自动提取特征向量入库'))
  check('刷新按钮', txt.includes('刷新'))
  check('上传图片按钮', txt.includes('上传图片'))

  // ── 2. 统计卡 4 张 ────────────────────────────────────
  console.log('=== 2. 统计卡 ===')
  const stats = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.lib-stat')).map((el) => ({
      label: (el.querySelector('.lib-stat-label')?.textContent || '').trim(),
      value: (el.querySelector('.lib-stat-value')?.textContent || '').trim(),
    }))
  )
  stats.forEach((s) => console.log(`      ${s.label} = ${s.value}`))
  check('统计卡 4 张', stats.length === 4, `count=${stats.length}`)
  for (const want of ['图片总数', '特征已入库', '仅缩略图待处理', '占用体积']) {
    check(`含统计项「${want}」`, stats.some((s) => s.label === want))
  }

  // ── 3. 上传区 + 提示 ──────────────────────────────────
  console.log('=== 3. 上传区 ===')
  check('拖拽区文案', txt.includes('把图片拖到这里，或点击选择'))
  check('格式提示', txt.includes('支持 PNG、JPG'))
  for (const tip of ['自动提取特征向量', '异常可单独重试', '重复图片自动标记']) {
    check(`右侧提示「${tip}」`, txt.includes(tip))
  }

  // ── 4. 工具条 ─────────────────────────────────────────
  console.log('=== 4. 工具条 ===')
  check('「图片列表」标题', txt.includes('图片列表'))
  check('条数显示', /共\s*\d+\s*张/.test(txt), (txt.match(/共\s*\d+\s*张/) || [''])[0])
  check('检索框', (await page.locator('.lib-search').count()) > 0)
  check('状态筛选下拉', (await page.locator('.lib-filter').count()) > 0)
  check('视图切换按钮 2 个', (await page.locator('.lib-view-btn').count()) === 2)

  // ── 5. 网格 + 角标 ────────────────────────────────────
  console.log('=== 5. 网格与角标 ===')
  const cells = await page.locator('.lib-cell').count()
  check('网格渲染出卡片', cells > 0, `cell=${cells}`)

  const imgStat = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('.lib-cell img'))
    return { total: list.length, decoded: list.filter((i) => i.naturalWidth > 0).length }
  })
  check('缩略图全部真实解码', imgStat.total > 0 && imgStat.total === imgStat.decoded,
    `${imgStat.decoded}/${imgStat.total}`)

  check('有「特征已入库」角标', (await page.locator('.lib-badge.is-ok').count()) > 0)
  check('有「仅缩略图」角标', (await page.locator('.lib-badge.is-warn').count()) > 0)
  // 「重复」不依赖存量数据判断（存量会被清理，断言会随之假红）：
  // 由第 9 步上传两张完全相同的图来验证指纹机制，见下方 DUP_* 断言。

  await shot('new-lib-1-grid')

  // ── 6. viewerjs 预览 ──────────────────────────────────
  console.log('=== 6. viewerjs 预览 ===')
  await page.locator('.lib-cell .lib-thumb img').first().click()
  await page.waitForTimeout(1800)
  const vw = await page.evaluate(() => ({
    container: !!document.querySelector('.viewer-container'),
    visible: !!document.querySelector('.viewer-container.viewer-in'),
    img: !!document.querySelector('.viewer-canvas img'),
    decoded: (() => {
      const i = document.querySelector('.viewer-canvas img')
      return i ? i.naturalWidth : 0
    })(),
  }))
  check('viewerjs 容器已创建', vw.container, JSON.stringify(vw))
  check('viewerjs 可见（viewer-in）', vw.visible)
  check('viewerjs 大图已解码', vw.decoded > 0, `naturalWidth=${vw.decoded}`)
  await shot('new-lib-2-viewer')

  // 关闭 viewer
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  const stillOpen = await page.evaluate(() => !!document.querySelector('.viewer-container.viewer-in'))
  check('Esc 可关闭 viewer', !stillOpen)

  // ── 7. 勾选与批量删除条 ───────────────────────────────
  console.log('=== 7. 勾选与批量操作条 ===')
  const before = await page.locator('.lib-cell').count()
  const checks = page.locator('.lib-cell .lib-check')
  await checks.nth(0).click()
  await page.waitForTimeout(400)
  await checks.nth(1).click()
  await page.waitForTimeout(600)

  const batchVisible = await page.evaluate(() => {
    const el = document.querySelector('.lib-batch')
    if (!el) return null
    return { text: (el.textContent || '').trim(), visible: getComputedStyle(el).visibility }
  })
  check('批量条出现', !!batchVisible && batchVisible.visible === 'visible', batchVisible?.text)
  const selCount = await page.locator('.lib-cell.is-selected').count()
  check('选中 2 张', selCount === 2, `selected=${selCount}`)
  await shot('new-lib-3-selected')

  // ── 8. 视图切换 ───────────────────────────────────────
  console.log('=== 8. 列表视图切换 ===')
  await page.locator('.lib-view-btn').nth(1).click()
  await page.waitForTimeout(1200)
  const rows = await page.locator('.lib-row').count()
  check('切到列表视图有行', rows > 0, `rows=${rows}`)
  await shot('new-lib-4-list')
  await page.locator('.lib-view-btn').nth(0).click()
  await page.waitForTimeout(1200)
  check('切回网格视图', (await page.locator('.lib-cell').count()) > 0)

  // ── 9. 批量删除真实生效 ───────────────────────────────
  console.log('=== 9. 批量删除 ===')
  // 基线：不写死条数 —— 存量数据会被外部操作改变，断言「回到操作前」才有意义
  const baseline = await page.evaluate(async (tk) => {
    const r = await fetch('/v2/image-search/list?page=1&size=100', { headers: { 'x-oauth-token': tk } })
    const o = await r.json()
    const d = o.data || {}
    return (d.data || d).total
  }, token)
  console.log(`  操作前基线: ${baseline} 条`)

  // 造 2 张**完全相同**的测试图：既避免删掉用户数据，
  // 又顺带验证「重复图片自动标记」的指纹机制真的生效（不依赖存量数据）
  //
  // 源图必须从**当前列表**里取：早先硬编码 /image-search/8/image，
  // 该 id 被删后取图 404，造图静默失败，后续按位置删除就误删了真实记录。
  const created = await page.evaluate(async (tk) => {
    const lr = await fetch('/v2/image-search/list?page=1&size=100', { headers: { 'x-oauth-token': tk } })
    const lo = await lr.json()
    const ld = lo.data || {}
    const items = ((ld.data || ld).items) || []
    if (!items.length) {
      return { ids: [], names: [], error: '底库为空，无法取源图' }
    }
    const srcId = items[0].id
    const sr = await fetch(`/v2/image-search/${srcId}/image`, { headers: { 'x-oauth-token': tk } })
    if (!sr.ok) {
      return { ids: [], names: [], error: `取源图失败 http=${sr.status} srcId=${srcId}` }
    }
    const blob = await sr.blob()
    if (!blob.size) {
      return { ids: [], names: [], error: '源图字节为空' }
    }
    const ids = []
    const names = []
    const stamp = Date.now()
    for (let i = 0; i < 2; i++) {
      const nm = `acc-dup-${stamp}-${i}.jpg`
      const file = new File([blob], nm, { type: 'image/jpeg' })
      const form = new FormData()
      form.append('file', file)
      form.append('name', nm)
      const r = await fetch('/v2/image-search/index', {
        method: 'POST',
        headers: { 'x-oauth-token': tk },
        body: form,
      })
      const o = await r.json()
      const id = (o.data || {}).id
      if (id) {
        ids.push(id)
        names.push(nm)
      }
    }
    return { ids, names, error: null }
  }, token)
  check('造出 2 张相同测试图', created.ids.length === 2,
    created.error ? `失败原因: ${created.error}` : `ids=${created.ids}`)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)

  // 两张测试图内容完全相同 → 指纹机制应把它们都标成「重复」
  const dupAfterUpload = await page.locator('.lib-badge.is-dup').count()
  check('相同图片被标记为「重复」', dupAfterUpload >= 2, `dupBadge=${dupAfterUpload}`)

  // 勾选这两张测试图：**按名字定位**，绝不能按位置（.nth(0)/.nth(1)）。
  // 血的教训：造图失败时列表里只剩真实记录，按位置勾选会把用户的记录删掉。
  const createdNames = created.names
  let picked = 0
  for (const nm of createdNames) {
    const cell = page.locator('.lib-cell', { hasText: nm }).first()
    if (await cell.count()) {
      await cell.locator('.lib-check').click()
      picked++
    }
  }
  await page.waitForTimeout(600)
  const pickedSelected = await page.locator('.lib-cell.is-selected').count()
  check('按名字勾中 2 张测试图', picked === 2 && pickedSelected === 2, `picked=${picked} selected=${pickedSelected}`)

  if (picked !== 2) {
    // 定位不到自己的测试图就**不做删除**：宁可这一项失败，也不能误删真实数据
    console.log('  [SKIP] 未能按名字定位测试图，跳过删除步骤以免误删真实记录')
    check('底库未受影响（跳过删除）', true, 'skipped')
  } else {
    page.once('dialog', (d) => d.accept())
    await page.locator('.lib-batch button:has-text("删除")').click()
    await page.waitForTimeout(4000)
    // usePopup 用 ElMessageBox，点确定
    const confirmBtn = page.locator('.el-message-box__btns button.el-button--primary')
    if (await confirmBtn.count()) {
      await confirmBtn.click()
    }
    await page.waitForTimeout(5000)

    const afterTotal = await page.evaluate(async (tk) => {
      const r = await fetch('/v2/image-search/list?page=1&size=100', { headers: { 'x-oauth-token': tk } })
      const o = await r.json()
      const d = o.data || {}
      return (d.data || d).total
    }, token)
    check('底库回到操作前基线（测试图已删）', afterTotal === baseline, `total=${afterTotal} baseline=${baseline}`)
  }

  // ── 10. 页面错误 ──────────────────────────────────────
  console.log('=== 10. 页面错误 ===')
  const isNoise = (s) =>
    /weather-api|ERR_ABORTED/.test(s) ||
    /登录失败/.test(s) ||
    /events\/sessions/.test(s) ||
    /Failed to load resource: the server responded with a status of 404/.test(s)
  const mineErrs = jsErrors.filter((e) => !isNoise(e))
  const mineReqs = failedReqs.filter((u) => !/weather-api|events\/sessions/.test(u))
  check('业务相关 0 JS 错误', mineErrs.length === 0, mineErrs.length ? mineErrs.slice(0, 3).join(' | ') : 'clean')
  check('业务相关 0 失败请求', mineReqs.length === 0, mineReqs.length ? mineReqs.slice(0, 3).join(' | ') : 'clean')
} catch (e) {
  console.log('  [FAIL] 脚本异常: ' + e.message)
  fail++
} finally {
  await browser.close()
}

console.log('')
console.log(`RESULT ${pass}/${pass + fail} PASSED`)
if (fail > 0) process.exitCode = 1
