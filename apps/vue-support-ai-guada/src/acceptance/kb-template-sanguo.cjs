/**
 * 知识库「三国演义知识图谱」模板 → 建库 → 全量复制（文档+实体+关系）浏览器验收。
 *
 * 步骤：UI 登录 → /knowledge-base → 从模板创建 → 选三国 → 断言数据集规模 →
 * 使用此模板创建 → 填名提交 → 轮询 API 直到模板的 17 文档 / 248 实体 / 387 关系全部落库。
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

  const uniqName = process.env.KB_NAME || ('三国演义知识图谱验' + String(Date.now()).slice(-5))  // 12 字，符合 2-20

  try {
    ok('UI 登录', await login(p))

    await p.goto(BASE + '/knowledge-base', { waitUntil: 'domcontentloaded', timeout: 120000 })
    await sleep(3500)

    // 进入模板页
    const tplBtn = p.locator('button:has-text("从模板创建")').first()
    await tplBtn.click({ timeout: 15000 })
    await sleep(2500)
    ok('模板页打开', await p.locator('text=从模板创建').first().isVisible().catch(() => false))

    // 三国卡片 + 数据集规模（从数据集源码解析真实规模，避免硬编码）
    const sanguoVisible = await p.locator('text=三国演义知识图谱').first().isVisible().catch(() => false)
    ok('三国模板卡片存在', sanguoVisible)

    const fsx = require('fs')
    const pathx = require('path')
    const datasetSrc = fsx.readFileSync(pathx.join(__dirname, '..', 'data', 'kb', 'templates', 'sanguo.ts'), 'utf8')
    const tplDocs = [...datasetSrc.matchAll(/\bpath: '([^']*)'/g)].map((m) => m[1])
    const tplEnts = [...new Set([...datasetSrc.matchAll(/\{ name: '([^']*)', type: '([^']*)'/g)].map((m) => m[1]))]
    const tplRels = [...datasetSrc.matchAll(/\{ source: '([^']*)', target: '([^']*)', type: '([^']*)'/g)].map((m) => ({ s: m[1], t: m[2] }))
    R.dataset = { docs: tplDocs.length, entities: tplEnts.length, relations: tplRels.length }

    const body = await p.locator('body').innerText().catch(() => '')
    ok(`详情显示 ${tplDocs.length} 文档`, new RegExp(tplDocs.length + '\\s*文档').test(body), body.match(/\d+\s*文档/)?.[0] || '')
    ok(`详情显示 ${tplEnts.length} 实体`, new RegExp(tplEnts.length + '\\s*实体').test(body))
    ok(`详情显示 ${tplRels.length} 关系`, new RegExp(tplRels.length + '\\s*关系').test(body))

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

    // 轮询：文档数 / 实体数 / 关系数 达标（最多 12 分钟；数据集 248 实体 / 387 关系，后端逐条写入）
    // 注意：上传 md 会触发后端 LLM 二次抽取，计数可能先于前端导入结束就触线；
    // 因此达标后还要等计数稳定（连续 3 次不变）才算导入真正结束，否则覆盖断言会过早取样。
    let docs = 0, entities = 0, relations = 0
    let stable = 0, prevTotal = -1
    for (let i = 0; i < 240; i++) {
      if (kbId) {
        const tree = await apiGet(`/api/knowledge/bases/${kbId}/tree`).catch(() => null)
        const cnt = (arr) => arr.reduce((n, r) => n + (r.is_dir ? cnt(r.children || []) : 1), 0)
        docs = cnt(tree?.data || [])
        const c = await apiGet(`/v2/rag/graph/count?knowledge_base_id=${kbId}`).catch(() => null)
        const cd = c?.data?.data || c?.data || {}
        entities = cd.entity_count ?? 0
        relations = cd.relation_count ?? 0
      }
      const total = docs + entities + relations
      const reached = docs >= tplDocs.length && entities >= tplEnts.length && relations >= tplRels.length
      if (reached && total === prevTotal) {
        stable++
        if (stable >= 3) break
      } else {
        stable = 0
      }
      prevTotal = total
      await sleep(3000)
    }
    R.counts = { docs, entities, relations }
    ok(`文档复制 = ${tplDocs.length}`, docs === tplDocs.length, 'got ' + docs)
    ok(`实体复制 >= ${tplEnts.length}`, entities >= tplEnts.length, 'got ' + entities)
    ok(`关系复制 >= ${tplRels.length}`, relations >= tplRels.length, 'got ' + relations)

    // ===== 严格覆盖断言：模板实体 + 关系必须「全部」落到新库 =====
    // 后端会对上传的 md 再做一次 LLM 抽取（补充实体/关系），所以：
    //   - 计数断言用 >=（后端的额外抽取会让总数偏大）；
    //   - 覆盖断言必须「一个不缺」——实体按名称、关系按端点有序对逐个比对。
    if (kbId) {
      const g = await apiGet('/v2/rag/graph?knowledge_base_id=' + kbId)
      const gd = g?.data?.data || g?.data || {}
      const nodes = gd.nodes || []
      const edges = gd.edges || []
      const nodeNames = new Set(nodes.map((n) => String(n.text || '').trim()))
      const id2name = new Map(nodes.map((n) => [String(n.id), String(n.text || '').trim()]))
      const pairSet = new Set(edges.map((e) => (id2name.get(String(e.from)) || '') + '\u0001' + (id2name.get(String(e.to)) || '')))
      const missEnt = tplEnts.filter((n) => !nodeNames.has(n))
      const missRel = [...new Set(tplRels.map((r) => r.s + '\u0001' + r.t))].filter((k) => !pairSet.has(k))
      // 诊断：缺失关系的完整清单、重复节点名、边的端点字段形态（用于定位 LLM 抽取干扰）
      if (missRel.length) {
        const nameCount = new Map()
        for (const n of nodes) {
          const nm = String(n.text || '').trim()
          nameCount.set(nm, (nameCount.get(nm) || 0) + 1)
        }
        const dupNames = [...nameCount.entries()].filter(([, c]) => c > 1).map(([nm, c]) => nm + 'x' + c)
        const sampleEdge = edges[0] || {}
        console.log('DIAG missRel=' + JSON.stringify(missRel.map((k) => k.replace('\u0001', '->'))))
        console.log('DIAG dupNames=' + JSON.stringify(dupNames.slice(0, 60)))
        console.log('DIAG edgeKeys=' + JSON.stringify(Object.keys(sampleEdge)) + ' nodes=' + nodes.length + ' edges=' + edges.length)
      }
      ok(`模板 ${tplEnts.length} 实体全部落库`, missEnt.length === 0, '缺 ' + missEnt.length + (missEnt[0] ? ' 如「' + missEnt[0] + '」' : ''))
      ok(`模板 ${tplRels.length} 关系全部落库(端点)`, missRel.length === 0, '缺 ' + missRel.length + (missRel[0] ? ' 如「' + missRel[0].replace('\u0001', '->') + '」' : ''))
    }

    // 资源清理：删除本次验证创建的知识库（模板类测试残留，避免污染后端）
    if (kbId) {
      const del = await fetch(BASE + '/api/knowledge/bases/' + kbId, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + RAW },
      }).then((r) => r.json()).catch(() => null)
      ok('测试库已清理', !!(del && del.success !== false), JSON.stringify(del || {}).slice(0, 100))
    }

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
