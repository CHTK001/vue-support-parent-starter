/**
 * 知识库「三国演义知识图谱」模板 → 建库 → 全量复制（文档+实体+关系）浏览器验收。
 *
 * 步骤：UI 登录 → /knowledge-base → 从模板创建 → 选三国 → 断言数据集规模 →
 * 使用此模板创建 → 填名提交 → 轮询 API 直到 10 文档 / 107 实体 / 189 关系全部落库。
 *
 * 断言：零 pageerror、零非噪声控制台错误、模板复制计数达标。
 * 退出码 0=全过，1=有失败。
 */
const { chromium } = require('playwright')

const BASE = process.env.BASE || 'http://localhost:15689'
const USER = process.env.USER_NAME || 'admin'
const PASS = process.env.USER_PASS || 'admin123'
const NOISE = /weather|typhoon|location|favicon|open-meteo|ResizeObserver/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let RAW = ''

async function login(p) {
  for (let i = 0; i < 4; i++) {
    const onResp = async (r) => {
      if (RAW) return
      if (!/\/v2\/user\/login/.test(r.url()) || r.request().method() !== 'POST') return
      try {
        const j = JSON.parse(await r.text())
        const t = j?.data?.accessToken || j?.data?.access_token
        if (t) RAW = t
      } catch { /* ignore */ }
    }
    p.on('response', onResp)
    await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 })
    await p.waitForSelector('input[type="password"]', { timeout: 40000 })
    await sleep(1200)
    await p.locator('input[type="text"]').first().fill(USER)
    await p.locator('input[type="password"]').first().fill(PASS)
    await p.locator('button:has-text("登")').first().click()
    try { await p.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 25000 }) } catch { /* ignore */ }
    await sleep(1200)
    p.off('response', onResp)
    if (RAW) return true
  }
  return false
}

(async () => {
  const b = await chromium.launch({ headless: true })
  const ctx = await b.newContext({ viewport: { width: 1512, height: 950 } })
  const p = await ctx.newPage()
  const pageErrors = []
  const consoleErrors = []
  const httpErrors = []
  p.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 200)))
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text().slice(0, 200)) })
  p.on('response', (r) => { if (r.status() >= 400 && !NOISE.test(r.url())) httpErrors.push(r.status() + ' ' + r.url().replace(BASE, '').slice(0, 120)) })

  const R = { pass: 0, fail: 0, checks: [], kbId: '', counts: null, pageErrors, consoleErrors, httpErrors }
  const ok = (name, cond, extra = '') => { if (cond) { R.pass++; R.checks.push('PASS ' + name) } else { R.fail++; R.checks.push('FAIL ' + name + (extra ? ' :: ' + extra : '')) } }

  const apiGet = async (path) => {
    const r = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + RAW } })
    return await r.json()
  }

  const uniqName = '三国演义知识图谱验' + String(Date.now()).slice(-5)  // 12 字，符合 2-20

  try {
    ok('UI 登录', await login(p))

    await p.goto(BASE + '/knowledge-base', { waitUntil: 'domcontentloaded', timeout: 120000 })
    await sleep(3500)

    // 进入模板页
    const tplBtn = p.locator('button:has-text("从模板创建")').first()
    await tplBtn.click({ timeout: 15000 })
    await sleep(2500)
    ok('模板页打开', await p.locator('text=从模板创建').first().isVisible().catch(() => false))

    // 三国卡片 + 数据集规模
    const sanguoVisible = await p.locator('text=三国演义知识图谱').first().isVisible().catch(() => false)
    ok('三国模板卡片存在', sanguoVisible)

    const body = await p.locator('body').innerText().catch(() => '')
    ok('详情显示 10 文档', /10\s*文档/.test(body), body.match(/\d+\s*文档/)?.[0] || '')
    ok('详情显示 107 实体', /107\s*实体/.test(body))
    ok('详情显示 189 关系', /189\s*关系/.test(body))

    // 使用此模板创建
    await p.locator('button:has-text("使用此模板创建")').first().click({ timeout: 15000 })
    await sleep(2000)

    // 建库弹框：改写名称
    const nameInput = p.locator('.el-dialog input[type="text"], .el-dialog input:not([type])').first()
    await nameInput.waitFor({ timeout: 15000 })
    await nameInput.fill(uniqName)
    await sleep(400)
    ok('建库弹框名称已填', (await nameInput.inputValue()) === uniqName)

    await p.locator('.el-dialog button:has-text("创建知识库")').first().click()
    await sleep(3000)

    // 找到新库 id
    let kbId = ''
    for (let i = 0; i < 20 && !kbId; i++) {
      const list = await apiGet('/api/knowledge/bases').catch(() => null)
      const rows = list?.data || []
      const hit = rows.find((x) => x.name === uniqName)
      if (hit) kbId = hit.knowledge_base_id || hit.id
      else await sleep(1000)
    }
    R.kbId = kbId
    ok('新知识库已创建', !!kbId, uniqName)

    // 轮询：文档数 / 实体数 / 关系数 达标（最多 6 分钟）
    let docs = 0, entities = 0, relations = 0
    for (let i = 0; i < 120; i++) {
      if (kbId) {
        const tree = await apiGet(`/api/knowledge/bases/${kbId}/tree`).catch(() => null)
        const cnt = (arr) => arr.reduce((n, r) => n + (r.is_dir ? cnt(r.children || []) : 1), 0)
        docs = cnt(tree?.data || [])
        const c = await apiGet(`/v2/rag/graph/count?knowledge_base_id=${kbId}`).catch(() => null)
        const cd = c?.data?.data || c?.data || {}
        entities = cd.entity_count ?? 0
        relations = cd.relation_count ?? 0
      }
      if (docs >= 10 && entities >= 107 && relations >= 189) break
      await sleep(3000)
    }
    R.counts = { docs, entities, relations }
    ok('文档复制 = 10', docs === 10, 'got ' + docs)
    ok('实体复制 >= 107', entities >= 107, 'got ' + entities)
    ok('关系复制 >= 189', relations >= 189, 'got ' + relations)

    ok('零 pageerror', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '))
    ok('零控制台错误', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))
  } catch (e) {
    R.fail++
    R.checks.push('FATAL ' + (e && e.message ? e.message.split('\n')[0] : String(e)).slice(0, 200))
  } finally {
    await b.close().catch(() => {})
    console.log(JSON.stringify(R, null, 2))
    console.log(`\n===== 浏览器验收: PASS=${R.pass} FAIL=${R.fail} =====`)
    process.exit(R.fail ? 1 : 0)
  }
})()
