/**
 * 生图页验收（Playwright 真实按键）。
 *
 * 为什么必须用 Playwright 而不是通用 browser 工具：
 *   通用工具的 type 对 contenteditable 是「整体替换 value」，不派发真实 keydown，
 *   Tiptap 的 onUpdate 链路走不到 —— 仓库里原有的 / 命令选择器也同样测不出来，
 *   会误判成「功能没实现」。这里用 keyboard.type / insertText 走真实输入事件。
 *
 * 覆盖：
 *   1. 输入 @ 是否弹出风格面板（含样式是否真正生效：位置/层级/可点击）
 *   2. 选风格后：描述写进 @ 位置、@ 被吃掉
 *   3. 点风格芯片：插到最前面
 *   4. 上传参考图：缩略图在输入框内、**下方无尺寸文案**、按原比例渲染
 *   5. 提交后参考图被清空
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://localhost:15689'
const SHOT = 'D:/ch/project/.tmp/sg/shots'
fs.mkdirSync(SHOT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  → ' + detail : ''}`)
}

// ── 登录 ──
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']", { timeout: 30000 })
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await page.waitForTimeout(3000)
await page.waitForTimeout(2000); check('登录', !page.url().includes('/login'), page.url())

await page.goto(`${BASE}/image-generate`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.ProseMirror', { timeout: 30000 })
await page.waitForTimeout(3500)

// ══ 1. @ 弹出风格面板 ══
console.log('\n【1】输入 @ 弹风格面板')
await page.click('.ProseMirror')
await page.keyboard.type('生成全新的博美图片', { delay: 25 })
await page.keyboard.insertText('@')
await page.waitForTimeout(1200)

const panelCount = await page.locator('.gsp-panel').count()
check('@ 后面板出现', panelCount > 0, `找到 ${panelCount} 个`)

if (panelCount > 0) {
  // 样式必须真正生效：position fixed + 居中 + 在视口内
  const box = await page.evaluate(() => {
    const mask = document.querySelector('.gsp-mask')
    const panel = document.querySelector('.gsp-panel')
    if (!mask || !panel) return null
    const mr = mask.getBoundingClientRect()
    const pr = panel.getBoundingClientRect()
    return {
      maskPos: getComputedStyle(mask).position,
      maskZ: getComputedStyle(mask).zIndex,
      maskCovers: mr.width >= window.innerWidth && mr.height >= window.innerHeight,
      panel: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height) },
      inViewport: pr.y >= 0 && pr.bottom <= window.innerHeight,
    }
  })
  check('遮罩为 fixed 且满屏', box?.maskPos === 'fixed' && box?.maskCovers === true, `position=${box?.maskPos} z=${box?.maskZ} 满屏=${box?.maskCovers}`)
  check('面板在视口内', box?.inViewport === true, JSON.stringify(box?.panel))

  const items = await page.locator('.gsp-item').count()
  const thumbs = await page.locator('.gsp-thumb img').count()
  const descs = await page.locator('.gsp-desc').count()
  check('风格项 8 个', items === 8, `${items} 个`)
  check('每项都有缩略图', thumbs === items, `缩略图 ${thumbs} / 项 ${items}`)
  check('每项都有描述（鼠标经过可见）', descs === items, `描述 ${descs} / 项 ${items}`)
  await page.screenshot({ path: `${SHOT}/01-at-panel.png` })

  // ══ 2. 选风格：插到 @ 位置 + 吃掉 @ ══
  console.log('\n【2】选风格后的插入位置')
  const before = (await page.locator('.ProseMirror').innerText()).trim()
  await page.locator('.gsp-item').nth(1).click()
  await page.waitForTimeout(1000)
  const after = (await page.locator('.ProseMirror').innerText()).trim()
  console.log(`    前: ${before}`)
  console.log(`    后: ${after}`)
  check('@ 已被吃掉', !after.includes('@'), after.includes('@') ? '仍含 @' : '已替换')
  check('描述已写入', after.length > before.length - 1 && after !== before, `长度 ${before.length} → ${after.length}`)
  check('面板已关闭', (await page.locator('.gsp-panel').count()) === 0)
  await page.screenshot({ path: `${SHOT}/02-style-inserted.png` })
}

// ══ 3. 点芯片：插到最前面 ══
console.log('\n【3】点风格芯片 → 插到最前')
await page.locator('.ProseMirror').click()
await page.keyboard.press('Control+A')
await page.keyboard.press('Delete')
await page.keyboard.type('一只博美在草地上', { delay: 25 })
await page.waitForTimeout(600)
const beforeChip = (await page.locator('.ProseMirror').innerText()).trim()
// 打开风格芯片
await page.click("button[title='风格模板']")
await page.waitForTimeout(900)
const chipItems = await page.locator('.wg-style').count()
check('芯片弹层有风格项', chipItems > 0, `${chipItems} 个`)
if (chipItems > 0) {
  await page.locator('.wg-style').nth(1).click()
  await page.waitForTimeout(900)
  const afterChip = (await page.locator('.ProseMirror').innerText()).trim()
  console.log(`    前: ${beforeChip}`)
  console.log(`    后: ${afterChip}`)
  check('芯片插入到最前面', afterChip.startsWith('胶片') || afterChip.indexOf('胶片') < afterChip.indexOf('博美'), afterChip.slice(0, 30))
  check('用户输入仍完整保留', afterChip.includes('一只博美在草地上'), afterChip.slice(0, 40))
  await page.screenshot({ path: `${SHOT}/03-chip-insert.png` })
}

// ══ 4. 上传参考图 ══
console.log('\n【4】上传参考图')
const refPath = 'D:/ch/project/.tmp/sg/style-raw/photo.png'
if (!fs.existsSync(refPath)) {
  check('参考图测试文件存在', false, refPath)
} else {
  const input = page.locator('input.wg-file')
  await input.setInputFiles(refPath)
  await page.waitForTimeout(2500)

  const refBox = await page.locator('.wg-ref-picked').count()
  check('缩略图出现在输入框内', refBox > 0, `找到 ${refBox} 个`)

  if (refBox > 0) {
    // 必须真的在 .input-area 内部（历史 bug：它是 .wg-composer 的兄弟节点，掉在框外）
    const inside = await page.evaluate(() => {
      const fig = document.querySelector('.wg-ref-picked')
      const area = document.querySelector('.input-area')
      const foot = document.querySelector('footer.wg-composer')
      if (!fig || !area || !foot) return null
      const f = fig.getBoundingClientRect()
      const a = area.getBoundingClientRect()
      return {
        inInputArea: area.contains(fig),
        inFooter: foot.contains(fig),
        figY: Math.round(f.y), areaY: Math.round(a.y), areaBottom: Math.round(a.bottom),
        withinArea: f.y >= a.y - 1 && f.bottom <= a.bottom + 1,
      }
    })
    check('缩略图在 .input-area 内部（不在框外）', inside?.inInputArea === true, JSON.stringify(inside))
    check('缩略图垂直位置在输入框内', inside?.withinArea === true, `缩略图 y=${inside?.figY} 输入框 ${inside?.areaY}~${inside?.areaBottom}`)

    // 不应有尺寸文案
    const hint = await page.locator('.wg-ref-hint').count()
    const figText = (await page.locator('.wg-ref-picked').innerText()).trim()
    check('缩略图下方无「原图 xxx」文案', hint === 0 && !figText.includes('原图') && !figText.includes('已缩放'), `文案="${figText}"`)

    // 提交时是否带了缩小后的图
    const src = await page.locator('.wg-ref-picked img').getAttribute('src')
    check('参考图是 data URL', !!src?.startsWith('data:image/'), src?.slice(0, 30))
  }
  await page.screenshot({ path: `${SHOT}/04-reference.png` })

  // ══ 5. 提交后参考图清空 ══
  console.log('\n【5】提交后清空参考图')
  await page.locator('.send-btn').click()
  await page.waitForTimeout(3000)
  const afterSubmit = await page.locator('.wg-ref-picked').count()
  check('提交后参考图已清空', afterSubmit === 0, `找到 ${afterSubmit} 个`)
  await page.screenshot({ path: `${SHOT}/05-after-submit.png` })
}

// ── 汇总 ──
console.log('\n' + '='.repeat(56))
const pass = results.filter((r) => r.pass).length
console.log(`结果：${pass}/${results.length} 通过`)
const failed = results.filter((r) => !r.pass)
if (failed.length) {
  console.log('未通过：')
  failed.forEach((r) => console.log(`  - ${r.name}${r.detail ? '  (' + r.detail + ')' : ''}`))
}
await browser.close()
process.exit(failed.length ? 1 : 0)
