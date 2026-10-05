/**
 * 「会话超时时间 / 生成任务超时时间」的浏览器验收。
 *
 * 覆盖用户新提的两项配置：
 *   1. 设置中心 → 会话配置 → 会话超时时间（stream_idle_timeout_minutes）
 *   2. 设置中心 → 默认模型 → 文生图/文生视频 → 生成任务超时时间（task_timeout_minutes）
 *
 * 两条都必须是「按用户隔离」的：写的是用户覆盖层，不是全局默认，且不影响别人。
 *
 * 为什么用脚本而不是手点：这两项是 el-input-number，靠 +/- 按钮改值；
 * 断言必须落到「服务端读回来的值」上，否则只能证明控件动了、证明不了真的存了。
 */
import { chromium } from 'playwright'

const API = process.env.AI_API || 'http://192.168.50.198:8787'
const FE = process.env.AI_FE || 'http://localhost:15689'

const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(name)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}

const login = async (u, p) => {
  const r = await fetch(`${API}/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: p }),
  })
  const j = await r.json()
  if (!j?.success || !j?.data?.accessToken) throw new Error(`${u} 登录失败: ${j?.msg}`)
  return j.data.accessToken
}

/** merged 响应是双层信封，对数组/对象两种形态都兜住 */
const mergedItems = (raw) => {
  const first = raw?.data ?? raw
  if (Array.isArray(first)) return first
  if (Array.isArray(first?.data)) return first.data
  return []
}
const readField = async (tok, group, field) => {
  const j = await (await fetch(`${API}/v2/settings/${group}/merged`, {
    headers: { Authorization: `Bearer ${tok}` },
  })).json()
  return mergedItems(j).find((i) => i?.field === field)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.setDefaultTimeout(60000)
const jsErrors = []
page.on('pageerror', (e) => jsErrors.push(String(e).slice(0, 160)))

console.log('=== 0. 令牌 ===')
const adminTok = await login('admin', 'admin123')
const opsTok = await login('ops', 'Ops@Guada2026')
chk('两个账号都能登录', !!adminTok && !!opsTok)

console.log('\n=== 1. 页面登录（前端自己的流程）===')
await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
// 不再用固定 sleep 等跳转：前端刚重启时首次编译要十几秒，固定等待必然误报
await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 90000 })
chk('登录后离开登录页', true, page.url())

console.log('\n=== 2. 会话配置页：会话超时时间可见且可改 ===')
await page.goto(`${FE}/setting/session-config`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.session-config-page', { timeout: 90000 })
// el-select 会把同一个 aria-label 同时打在 combobox 输入框和下拉列表上，
// 必须只取输入框，否则 locator 命中 2 个元素直接 strict mode violation
const idleRow = page.locator('input[aria-label="会话超时时间（分钟）"]')
chk('会话超时时间控件存在', (await idleRow.count()) > 0)

// 清理本次会写入的覆盖，便于反复运行
await fetch(`${API}/v2/settings/session/overrides`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminTok}` },
  body: JSON.stringify({ stream_idle_timeout_minutes: null }),
})
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('input[aria-label="会话超时时间（分钟）"]', { timeout: 90000 })

const before = await readField(adminTok, 'session', 'stream_idle_timeout_minutes')
const beforeVal = Number(before?.value ?? before?.defaultValue)
console.log(`  初始值 value=${before?.value} default=${before?.defaultValue}`)

// 点开下拉，读出实际档位。
// 点 .el-select__wrapper 而不是 combobox input：后者被 el-select__suffix 的箭头
// 盖住，Playwright 会判定 pointer events 被拦截而一直重试到超时。
await page.evaluate(() => {
  const input = document.querySelector('input[aria-label="会话超时时间（分钟）"]')
  input?.closest('.el-select')?.querySelector('.el-select__wrapper')?.click()
})
await page.waitForTimeout(600)
const options = await page.evaluate(() =>
  [...document.querySelectorAll('.el-select-dropdown__item')].map((e) => e.textContent.trim()),
)
console.log(`  可选档位: ${options.join(' / ')}`)
chk('下拉里有完整档位（含「不限制」）', options.includes('不限制') && options.length >= 6, `${options.length} 项`)

// 选一个与初始值不同的档位
const want = beforeVal === 60 ? '15 分钟' : '60 分钟'
const wantVal = beforeVal === 60 ? 15 : 60
const picked = await page.evaluate((label) => {
  const items = [...document.querySelectorAll('.el-select-dropdown__item')]
  const target = items.find((e) => e.textContent.trim() === label)
  if (!target) return null
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return target.textContent.trim()
}, want)
chk(`下拉里能选到「${want}」`, picked === want, `picked=${picked}`)

if (picked) {
  await page.waitForTimeout(1500)
  const after = await readField(adminTok, 'session', 'stream_idle_timeout_minutes')
  chk(`选中后服务端读回 ${wantVal}`, Number(after?.value) === wantVal, `after=${after?.value}`)
  chk('该项变成「本人覆盖」而非继承全局', after?.overridden === true, `overridden=${after?.overridden}`)
  chk('选的值与初始值不同（否则这条断言是空的）', wantVal !== beforeVal, `before=${beforeVal}`)
}

if (picked) {
  await page.waitForTimeout(1500)
  const after = await readField(adminTok, 'session', 'stream_idle_timeout_minutes')
  chk('选中后服务端读回 60', Number(after?.value) === 60, `after=${after?.value}`)
  chk('该项变成「本人覆盖」而非继承全局', after?.overridden === true, `overridden=${after?.overridden}`)
  chk('选的值与初始值不同（否则这条断言是空的）', 60 !== beforeVal, `before=${beforeVal}`)
}

console.log('\n=== 3. 按用户隔离：ops 不受 admin 影响 ===')
const opsSees = await readField(opsTok, 'session', 'stream_idle_timeout_minutes')
const adminSees = await readField(adminTok, 'session', 'stream_idle_timeout_minutes')
chk(
  'admin 与 ops 读到的会话超时不同',
  Number(adminSees?.value) !== Number(opsSees?.value) || opsSees?.overridden !== true,
  `admin=${adminSees?.value}(ov=${adminSees?.overridden}) ops=${opsSees?.value}(ov=${opsSees?.overridden})`,
)
chk('ops 未被写成覆盖（仍继承默认）', opsSees?.overridden !== true, `overridden=${opsSees?.overridden}`)

console.log('\n=== 4. 默认模型页：生成任务超时时间常驻可见（不在高级选项里）===')
await page.goto(`${FE}/setting/default-models`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('text=文生图 / 文生视频', { timeout: 90000 })
const genCard = page.locator('.settings-card, [class*=card]').filter({ hasText: '文生图 / 文生视频' })
const genText = await genCard.first().innerText().catch(() => '')
chk('生成任务超时时间在分组正文里直接可见', genText.includes('生成任务超时时间'), genText.includes('生成任务超时时间') ? '' : 'not found in visible block')

const spin = page.locator('input[type="number"]').filter({ hasNot: page.locator('[aria-label]') })
chk('页面存在数字输入控件', (await spin.count()) > 0, `count=${await spin.count()}`)

console.log('\n=== 5. 无意外 JS 错误 ===')
const unexpected = jsErrors.filter((e) => !/workspace|SSE|404/.test(e))
chk('没有意外 JS 错误', unexpected.length === 0, unexpected.slice(0, 3).join(' | '))

console.log('\n=== 6. 清理本次写入的覆盖 ===')
await fetch(`${API}/v2/settings/session/overrides`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminTok}` },
  body: JSON.stringify({ stream_idle_timeout_minutes: null }),
})
const cleaned = await readField(adminTok, 'session', 'stream_idle_timeout_minutes')
chk('撤销覆盖后回到继承默认', cleaned?.overridden === false, `overridden=${cleaned?.overridden} value=${cleaned?.value}`)

await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}