// 验收：底栏「相似度下限」是否显示（双层 data 包装修复）
import { chromium } from 'playwright'

const BASE = process.env.AI_ACCEPT_BASE || 'http://localhost:15689'
const PASS = process.env.AI_ACCEPT_PASS

let pass = 0
let fail = 0
const check = (n, ok, d = '') => {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${n}${d ? ' -> ' + d : ''}`)
  ok ? pass++ : fail++
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()

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

  await page.goto(`${BASE}/setting/image-library`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4500)

  // 诊断：确认页面确实停在图片库而不是被守卫踢回登录页
  console.log(`  当前 URL: ${page.url()}`)
  const bodyText = await page.locator('body').innerText().catch(() => '')
  console.log(`  页面可见文本前 160 字: ${JSON.stringify(bodyText.slice(0, 160))}`)
  console.log(`  .lib-page 节点数: ${await page.locator('.lib-page').count()}`)
  console.log(`  .lib-foot 节点数: ${await page.locator('.lib-foot').count()}`)

  const foot = await page.locator('.lib-foot').innerText().catch(() => '')
  console.log(`  底栏实际内容: "${foot.trim()}"`)
  check('底栏含特征模型', /特征模型：\S/.test(foot))
  check('底栏含相似度下限', /相似度下限\s*[\d.]+/.test(foot), (foot.match(/相似度下限\s*[\d.]+/) || [''])[0])
  check('相似度值不为空', !/相似度下限\s*$/.test(foot))

  // 统计卡不应再有「—」
  const stats = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.lib-stat')).map((el) => ({
      label: (el.querySelector('.lib-stat-label')?.textContent || '').trim(),
      value: (el.querySelector('.lib-stat-value')?.textContent || '').trim(),
    }))
  )
  stats.forEach((s) => console.log(`      ${s.label} = ${s.value}`))
  const sizeStat = stats.find((s) => s.label === '占用体积')
  check('占用体积不是未知', !!sizeStat && sizeStat.value !== '—', sizeStat?.value)
} catch (e) {
  console.log('  [FAIL] 脚本异常: ' + e.message)
  fail++
} finally {
  await browser.close()
}

console.log('')
console.log(`RESULT ${pass}/${pass + fail} PASSED`)
if (fail > 0) process.exitCode = 1
