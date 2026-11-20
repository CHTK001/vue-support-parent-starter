// 批次 A 复验：GenerateComposer「不支持文件」toast（粘贴 / 拖放两条路径）
// 背景：原浏览器验收已通过（验收报告第一节 #9），15689 重启后因 vite 按需编译阻塞未复跑；
// 本脚本在 15689 恢复后独立复验。真实链路：15689（复用在跑 dev，不重启）+ 真实登录。
// 用法：node test/ai/generate-zip-toast-recheck.mjs
import { chromium } from 'playwright'

const BASE = process.env.ACCEPT_BASE ?? 'http://127.0.0.1:15689'
const results = []
const assert = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`)
}
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`)

const browser = await chromium.launch({ headless: true, channel: 'msedge' })
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } })
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })

  // 登录：等待首屏（vite 冷编译可能很慢）→ 滑块验证 → 账号密码 + 点击登录按钮
  let loggedIn = false
  for (let i = 0; i < 60; i++) {
    const token = await page.evaluate(() => localStorage.getItem('ai-guada:accessToken'))
    if (token) { loggedIn = true; break }
    const form = await page.locator('input[placeholder="请输入用户名"]').count()
    if (form) break
    if (i % 10 === 0) {
      const diag = await page.evaluate(() => ({
        url: location.href,
        len: (document.body.innerText || '').trim().length,
        inputs: document.querySelectorAll('input').length,
      }))
      log(`try${i} waiting: ${JSON.stringify(diag)}`)
    }
    await page.waitForTimeout(2000)
  }
  const hasForm = await page.locator('input[placeholder="请输入用户名"]').count()
  if (!loggedIn && hasForm) {
    // 滑块验证（与 8848 登录同款 slider-verify 组件：拖 thumb 到最右）
    for (let s = 1; s <= 3; s++) {
      const passed0 = await page.evaluate(() => !!document.querySelector('.slider-verify--success, .slider-verify.is-success'))
      if (passed0) break
      const track = page.locator('.slider-verify-track').first()
      if (!(await track.count())) break
      const tb = await track.boundingBox().catch(() => null)
      if (!tb) break
      const sy = tb.y + tb.height / 2
      const sx = tb.x + 22
      const ex = tb.x + tb.width + 30
      await page.mouse.move(sx, sy)
      await page.mouse.down()
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(sx + ((ex - sx) * i) / 12, sy, { steps: 1 })
        await page.waitForTimeout(40)
      }
      await page.mouse.up()
      await page.waitForTimeout(900)
      const passed = await page.evaluate(() => !!document.querySelector('.slider-verify--success, .slider-verify.is-success'))
      log(`slider try${s} passed=${passed}`)
      if (passed) break
    }
    await page.fill('input[placeholder="请输入用户名"]', 'admin')
    await page.fill('input[placeholder="请输入密码"]', 'admin123')
    await page.locator('.login-btn').first().click({ timeout: 15000 }).catch(() => {})
    for (let i = 0; i < 20; i++) {
      const ok = await page.evaluate(() =>
        !!localStorage.getItem('ai-guada:accessToken') || !location.pathname.includes('/login'),
      )
      if (ok) { loggedIn = true; break }
      await page.waitForTimeout(1000)
    }
  }
  assert('登录成功', loggedIn, page.url())

  // 打开生图页：首次动态导入可能吃 504 Outdated Optimize Dep（vite 随后自愈），
  // 空白超过 30s 就 reload 一次触发重新拉取，总上限 ~180s
  await page.goto(BASE + '/image-generate', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
  let rendered = -1
  for (let i = 0; i < 90; i++) {
    const len = await page.evaluate(() => (document.body.innerText || '').trim().length).catch(() => 0)
    if (len >= 80) { rendered = i; break }
    if (i > 0 && i % 15 === 0) await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(2000)
  }
  assert('生图页渲染完成', rendered >= 0, `waited≈${rendered * 2}s url=${page.url()}`)

  const editorSel = (await page.locator('.message-editor .ProseMirror').count())
    ? '.message-editor .ProseMirror'
    : '[contenteditable="true"]'
  const hasEditor = await page.locator(editorSel).first().count()
  assert('编辑器存在', hasEditor > 0, editorSel)

  const readToast = () =>
    page.evaluate(() => Array.from(document.querySelectorAll('.el-message')).map((m) => m.innerText.trim()))

  // 路径 1：粘贴 bad.zip（先真实点击编辑器 → Tiptap onFocus → focused=true；
  // 再用真实 ClipboardEvent 派发 paste，走 ProseMirror handlePaste → 组件 handlePaste）
  if (hasEditor) {
    await page.locator(editorSel).first().click()
    await page.waitForTimeout(300)
    await page.evaluate(() => {
      const el = document.querySelector('.message-editor .ProseMirror') || document.querySelector('[contenteditable="true"]')
      const dt = new DataTransfer()
      dt.items.add(new File(['dummy-zip-bytes'], 'bad.zip', { type: 'application/zip' }))
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
    })
    await page.waitForTimeout(1800)
    const t1 = await readToast()
    assert('粘贴 zip → 出现「不支持文件」toast', t1.some((t) => t.includes('已忽略') && t.includes('不支持的文件')), JSON.stringify(t1))

    // 路径 2：拖放 bad.zip
    const dt2 = await page.evaluateHandle(() => {
      const d = new DataTransfer()
      d.items.add(new File(['dummy-zip-bytes'], 'bad2.zip', { type: 'application/zip' }))
      return d
    })
    await page.dispatchEvent(editorSel, 'drop', { dataTransfer: dt2 })
    await page.waitForTimeout(1800)
    const t2 = await readToast()
    assert('拖放 zip → 出现「不支持文件」toast', t2.some((t) => t.includes('已忽略') && t.includes('不支持的文件')), JSON.stringify(t2))
  }
} finally {
  await browser.close().catch(() => {})
}

const fails = results.filter((r) => !r.ok)
console.log('==== RESULT ====')
console.log(`total=${results.length} pass=${results.length - fails.length} fail=${fails.length}`)
if (fails.length) process.exitCode = 1
