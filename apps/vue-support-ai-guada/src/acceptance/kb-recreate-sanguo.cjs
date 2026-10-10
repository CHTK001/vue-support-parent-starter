/**
 * 三国知识库重建脚本：删除旧库 → 用模板数据集整体重建（文档 + 实体 + 关系）。
 *
 * <p>背景：模板数据只在「建库那一刻」复制一次；数据集扩写（README 17 篇文档 /
 * 248 实体 / 387 关系）后，旧库不会自动回填，只能重建。本脚本直连后端
 * （默认 {@code 192.168.50.198:8787}），不经过前端 dev 服务器：</p>
 *
 * <ol>
 *   <li>从源码 {@code sanguo.ts} 加载数据集（esbuild 转译，与前端模板同源，规模不硬编码）；</li>
 *   <li>删除同名知识库（含 {@code OLD_KB_ID} 指定的旧库，若仍在）；</li>
 *   <li>新建同名知识库，按「文档 → 实体 → 关系」顺序整体写入；</li>
 *   <li>轮询计数达标且稳定后，做覆盖断言（实体按名称、关系按有序端点对，一个不缺）；</li>
 *   <li>问答冒烟：{@code POST /ask} 要求返回答案与引用（验证 jvector 维度修复已生效）。</li>
 * </ol>
 *
 * <p>前置：后端须已部署 {@code JVectorVectorStorage} 维度校验修复，否则问答仍报
 * {@code Node execution failed: search}。上传 md 会触发后端 LLM 二次抽取（追加实体/关系），
 * 故计数断言用 {@code >=}、且达标后须等计数稳定（连续 3 次不变）防过早取样。</p>
 *
 * <p>用法：{@code node src/acceptance/kb-recreate-sanguo.cjs}（在 apps/vue-support-ai-guada 下执行）</p>
 * <p>环境：{@code BASE}（默认 http://192.168.50.198:8787）、{@code KB_NAME}（默认 三国演义知识图谱）、
 * {@code OLD_KB_ID}（默认 01a11b97-8385-7417-bb02-12b08ff75a61，传空串跳过）、
 * {@code USER_NAME} / {@code USER_PASS}（默认 admin / admin123）。</p>
 *
 * <p>退出码 0=全过，1=有失败。本脚本**不清库**（重建结果保留），重跑即重删重建。</p>
 */
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE || 'http://192.168.50.198:8787'
const USER = process.env.USER_NAME || 'admin'
const PASS = process.env.USER_PASS || 'admin123'
const KB_NAME = process.env.KB_NAME || '三国演义知识图谱'
const OLD_KB_ID = process.env.OLD_KB_ID === undefined ? '01a11b97-8385-7417-bb02-12b08ff75a61' : process.env.OLD_KB_ID

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) kb-recreate-sanguo'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let TOKEN = ''

/**
 * TS → CJS 转译：优先 esbuild（快），平台二进制缺失时退回 typescript。
 *
 * <p>本机 esbuild 0.28.1 的 {@code @esbuild/win32-x64} 未链接到应用 node_modules，
 * 直接 require 会在 transform 时抛 "could not be found"；typescript 包必然随
 * vue-tsc 存在，作为兜底保证脚本可跑。数据集只有 {@code import type}（转译即擦除），
 * 无需处理运行时模块解析。</p>
 */
function transpileTs(src) {
  try {
    const esbuild = require('esbuild')
    return esbuild.transformSync(src, { loader: 'ts', format: 'cjs', target: 'node18' }).code
  } catch (e) {
    const ts = require('typescript')
    const out = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    })
    return out.outputText
  }
}

/** 数据集：与前端模板同源加载（TS → CJS 后求值）。 */
function loadDataset() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'data', 'kb', 'templates', 'sanguo.ts'), 'utf8')
  const code = transpileTs(src)
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require)
  const ds = mod.exports.SANGUO_DATASET || mod.exports.default
  if (!ds || !Array.isArray(ds.docs) || !Array.isArray(ds.entities) || !Array.isArray(ds.relations)) {
    throw new Error('SANGUO_DATASET 加载失败或结构不完整')
  }
  return ds
}

/** 统一请求：Bearer 鉴权；GET 参数走 query，POST 参数走 query（与前端 apiHttp.post(url, {}, {params}) 同形）。 */
async function api(method, p, { query, body, retries = 2, timeoutMs = 60000 } = {}) {
  let url = BASE + p
  if (query) url += '?' + new URLSearchParams(query).toString()
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, {
        method,
        headers: {
          Authorization: TOKEN ? 'Bearer ' + TOKEN : undefined,
          'User-Agent': UA,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      })
      const text = await r.text()
      let json = null
      try { json = JSON.parse(text) } catch { /* 非 JSON 原样保留在 text */ }
      return { status: r.status, json, text }
    } catch (e) {
      if (i >= retries) throw e
      await sleep(1200)
    }
  }
}

/** 写操作是否成功：HTTP < 400 且响应未显式 success=false / code 非错误码。 */
function isOk(res) {
  if (res.status >= 400) return false
  if (res.json && res.json.success === false) return false
  return true
}

(async () => {
  const R = {
    base: BASE, kbName: KB_NAME, kbId: '',
    dataset: null, created: { docs: 0, entities: 0, relations: 0 },
    counts: null, coverage: null, ask: null,
    checks: [], pass: 0, fail: 0,
  }
  const ok = (name, cond, extra = '') => {
    if (cond) { R.pass++; R.checks.push('PASS ' + name) } else { R.fail++; R.checks.push('FAIL ' + name + (extra ? ' :: ' + extra : '')) }
  }

  try {
    // ── 数据集 ──
    const ds = loadDataset()
    const tplDocs = ds.docs.length
    const entNames = [...new Set(ds.entities.map((e) => e.name))]
    const relPairs = [...new Set(ds.relations.map((r) => r.source + '\u0001' + r.target))]
    R.dataset = { docs: tplDocs, entities: entNames.length, relations: relPairs.length }
    console.log(`[dataset] docs=${tplDocs} entities=${entNames.length}(raw ${ds.entities.length}) relations=${relPairs.length}(raw ${ds.relations.length})`)
    if (process.env.DS_ONLY === '1') { console.log(JSON.stringify(R.dataset)); process.exit(0) }

    // ── 登录 ──
    const lr = await api('POST', '/v2/user/login', { body: { username: USER, password: PASS } })
    TOKEN = lr.json?.data?.accessToken || lr.json?.data?.access_token || ''
    ok('API 登录', !!TOKEN, `status=${lr.status}`)
    if (!TOKEN) throw new Error('登录失败：' + String(lr.text).slice(0, 200))

    // ── 删旧库（同名 + OLD_KB_ID） ──
    const list0 = await api('GET', '/api/knowledge/bases')
    const rows0 = list0.json?.data || []
    const victims = rows0.filter((x) => {
      const id = String(x.knowledge_base_id || x.id || '')
      return (id && id === OLD_KB_ID) || x.name === KB_NAME
    })
    for (const v of victims) {
      const id = String(v.knowledge_base_id || v.id)
      const dr = await api('DELETE', '/api/knowledge/bases/' + encodeURIComponent(id))
      console.log(`[delete] ${v.name} (${id}) -> status=${dr.status}`)
    }
    ok(`旧库已删除（${victims.length} 个）`, true)

    // ── 建新库并取 id ──
    const desc = `从「三国演义知识图谱」模板重建：${tplDocs} 篇文档 · ${entNames.length} 实体 · ${relPairs.length} 关系`
    const cr = await api('POST', '/api/knowledge/bases', { body: { name: KB_NAME, description: desc, is_public: false } })
    let kbId = String(cr.json?.data?.knowledge_base_id || cr.json?.data?.id || '')
    if (!kbId) {
      for (let i = 0; i < 20 && !kbId; i++) {
        const l = await api('GET', '/api/knowledge/bases')
        const hit = (l.json?.data || []).find((x) => x.name === KB_NAME)
        if (hit) kbId = String(hit.knowledge_base_id || hit.id || '')
        else await sleep(1000)
      }
    }
    R.kbId = kbId
    ok('新知识库已创建', !!kbId, `status=${cr.status} ${KB_NAME}`)
    if (!kbId) throw new Error('建库失败：' + String(cr.text).slice(0, 200))

    // ── 1) 文档（保目录层级；逐篇上传触发后端建索引） ──
    const t0 = Date.now()
    for (let i = 0; i < ds.docs.length; i++) {
      const d = ds.docs[i]
      const w = await api('PUT', `/api/knowledge/bases/${encodeURIComponent(kbId)}/file`, { body: { path: d.path, content: d.content } })
      if (isOk(w)) R.created.docs++
      else console.log(`  [doc FAIL] ${d.path} status=${w.status} ${String(w.text).slice(0, 120)}`)
      if ((i + 1) % 5 === 0) console.log(`[docs] ${i + 1}/${ds.docs.length} ok=${R.created.docs}`)
    }
    ok(`文档写入 ${tplDocs}`, R.created.docs === tplDocs, `got ${R.created.docs} 用时 ${Math.round((Date.now() - t0) / 1000)}s`)

    // ── 2) 实体（带真实类型，避免关系端点退化成 other 占位） ──
    const t1 = Date.now()
    for (let i = 0; i < ds.entities.length; i++) {
      const e = ds.entities[i]
      const w = await api('POST', '/v2/rag/graph/entity', {
        query: { knowledge_base_id: kbId, knowledge_base_name: KB_NAME, name: e.name, type: e.type, description: e.description || '', logo: e.image || '' },
      })
      if (isOk(w)) R.created.entities++
      else console.log(`  [entity FAIL] ${e.name} status=${w.status} ${String(w.text).slice(0, 120)}`)
      if ((i + 1) % 50 === 0) console.log(`[entities] ${i + 1}/${ds.entities.length} ok=${R.created.entities} 用时 ${Math.round((Date.now() - t1) / 1000)}s`)
    }
    ok(`实体写入 ${ds.entities.length}`, R.created.entities === ds.entities.length, `got ${R.created.entities} 用时 ${Math.round((Date.now() - t1) / 1000)}s`)

    // ── 3) 关系（后端同有序点对只保留一条边） ──
    const t2 = Date.now()
    for (let i = 0; i < ds.relations.length; i++) {
      const r = ds.relations[i]
      const w = await api('POST', '/v2/rag/graph/relation', {
        query: { knowledge_base_id: kbId, knowledge_base_name: KB_NAME, source: r.source, target: r.target, type: r.type },
      })
      if (isOk(w)) R.created.relations++
      else console.log(`  [relation FAIL] ${r.source}->${r.target} status=${w.status} ${String(w.text).slice(0, 120)}`)
      if ((i + 1) % 80 === 0) console.log(`[relations] ${i + 1}/${ds.relations.length} ok=${R.created.relations} 用时 ${Math.round((Date.now() - t2) / 1000)}s`)
    }
    ok(`关系写入 ${ds.relations.length}`, R.created.relations === ds.relations.length, `got ${R.created.relations} 用时 ${Math.round((Date.now() - t2) / 1000)}s`)

    // ── 4) 轮询计数：达标 + 稳定（连续 3 次不变） ──
    let docs = 0, entities = 0, relations = 0
    let stable = 0, prevTotal = -1
    for (let i = 0; i < 240; i++) {
      const tree = await api('GET', `/api/knowledge/bases/${encodeURIComponent(kbId)}/tree`).catch(() => null)
      const cnt = (arr) => (arr || []).reduce((n, r) => n + (r.is_dir ? cnt(r.children || []) : 1), 0)
      docs = cnt(tree?.json?.data)
      const c = await api('GET', '/v2/rag/graph/count', { query: { knowledge_base_id: kbId } }).catch(() => null)
      const cd = c?.json?.data?.data || c?.json?.data || {}
      entities = cd.entity_count ?? 0
      relations = cd.relation_count ?? 0
      const total = docs + entities + relations
      const reached = docs >= tplDocs && entities >= entNames.length && relations >= relPairs.length
      if (reached && total === prevTotal) {
        stable++
        if (stable >= 3) break
      } else {
        stable = 0
      }
      prevTotal = total
      if (i % 10 === 0) console.log(`[poll] docs=${docs}/${tplDocs} entities=${entities}/${entNames.length} relations=${relations}/${relPairs.length}`)
      await sleep(3000)
    }
    R.counts = { docs, entities, relations }
    ok(`文档落库 = ${tplDocs}`, docs === tplDocs, `got ${docs}`)
    ok(`实体落库 >= ${entNames.length}`, entities >= entNames.length, `got ${entities}`)
    ok(`关系落库 >= ${relPairs.length}`, relations >= relPairs.length, `got ${relations}`)

    // ── 5) 覆盖断言：模板实体/关系一个不缺（LLM 抽取只允许加、不允许替） ──
    const g = await api('GET', '/v2/rag/graph', { query: { knowledge_base_id: kbId } })
    const gd = g.json?.data?.data || g.json?.data || {}
    const nodes = gd.nodes || []
    const edges = gd.edges || []
    const nodeNames = new Set(nodes.map((n) => String(n.text || '').trim()))
    const id2name = new Map(nodes.map((n) => [String(n.id), String(n.text || '').trim()]))
    const pairSet = new Set(edges.map((e) => (id2name.get(String(e.from)) || '') + '\u0001' + (id2name.get(String(e.to)) || '')))
    const missEnt = entNames.filter((n) => !nodeNames.has(n))
    const missRel = relPairs.filter((k) => !pairSet.has(k))
    R.coverage = { missEnt, missRel }
    ok(`模板 ${entNames.length} 实体全部落库`, missEnt.length === 0, '缺 ' + missEnt.length + (missEnt[0] ? ' 如「' + missEnt[0] + '」' : ''))
    ok(`模板 ${relPairs.length} 关系全部落库(端点)`, missRel.length === 0, '缺 ' + missRel.length + (missRel[0] ? ' 如「' + missRel[0].replace('\u0001', '->') + '」' : ''))

    // ── 6) 问答冒烟：要求返回答案（验证 jvector 修复 + 向量已重建） ──
    let askOk = false, answer = '', citations = 0, lastErr = ''
    for (let i = 0; i < 6 && !askOk; i++) {
      const a = await api('POST', `/api/knowledge/bases/${encodeURIComponent(kbId)}/ask`, {
        body: { query: '关羽和张飞是什么关系？', top_k: 5 },
        timeoutMs: 120000,
      }).catch((e) => ({ status: 0, text: String(e.message || e), json: null }))
      const d = a.json?.data || {}
      answer = String(d.answer || '')
      citations = Array.isArray(d.citations) ? d.citations.length : 0
      if (a.status < 400 && answer && !/失败|error/i.test(answer.slice(0, 40))) { askOk = true; break }
      lastErr = `status=${a.status} ${String(a.json?.msg || a.text || '').slice(0, 120)}`
      console.log(`[ask] 第 ${i + 1} 次未通过：${lastErr}`)
      await sleep(15000)
    }
    R.ask = { ok: askOk, answerLen: answer.length, citations, snippet: answer.slice(0, 60) }
    ok('库内问答恢复（含引用）', askOk && answer.length > 0, lastErr || (askOk ? `answerLen=${answer.length} citations=${citations}` : '无答案'))
  } catch (e) {
    R.fail++
    R.checks.push('FATAL ' + String(e && e.message ? e.message : e).split('\n')[0].slice(0, 240))
  } finally {
    console.log('\n' + JSON.stringify(R, null, 2))
    console.log(`\n===== 三国库重建: PASS=${R.pass} FAIL=${R.fail} =====`)
    process.exit(R.fail ? 1 : 0)
  }
})()
