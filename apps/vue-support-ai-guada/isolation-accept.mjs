/**
 * 需求 6 的跨账号隔离验收：管理员在设置中心之外不得看到/改动他人数据。
 *
 * 背景：此前各业务链路用 AiUserContext.isAdmin() 直接放行管理员读他人
 * 会话/记忆/底库/定时任务，与「管理员除设置中心外与普通用户同权」的要求相反。
 * 现已统一收敛到 AiUserContext.canAccessOthersData()（恒 false），本脚本对
 * **已按路径归属真实数据**的出口逐个验证 admin 与 ops 互不可见。
 *
 * 关键设计：先让 ops 自己造数据（会话/设置覆盖），再拿 admin 去读同一 id。
 * 只测「admin 列出的东西里没有别人的」是不够的 —— 那可能是 ops 压根没数据。
 */
const API = process.env.AI_API || 'http://192.168.50.198:8787'

const pass = []
const fail = []
const chk = (n, ok, extra = '') => {
  ;(ok ? pass : fail).push(n)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? '  ' + extra : ''}`)
}

const login = async (username, password) => {
  const r = await fetch(`${API}/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const j = await r.json()
  if (!j?.success || !j?.data?.accessToken) {
    throw new Error(`${username} 登录失败: code=${j?.code} msg=${j?.msg}`)
  }
  return j.data.accessToken
}

const call = async (tok, method, path, body) => {
  const init = { method, headers: { Authorization: `Bearer ${tok}` } }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const r = await fetch(`${API}${path}`, init)
  let json = null
  try {
    json = await r.json()
  } catch {
    json = null
  }
  return { status: r.status, json }
}

console.log('=== 0. 登录 ===')
const adminTok = await login('admin', 'admin123')
const opsTok = await login('ops', 'Ops@Guada2026')
chk('admin 与 ops 各拿到令牌', !!adminTok && !!opsTok)

console.log('\n=== 1. ops 造一条属于自己的会话（否则后面全是假阴性）===')
const created = await call(opsTok, 'POST', '/v2/sessions', { title: 'isolation-probe-ops' })
const opsSessionId = created.json?.data?.id
chk('ops 能创建会话', created.status < 400 && !!opsSessionId, `HTTP ${created.status} id=${opsSessionId}`)

console.log('\n=== 2. admin 读 ops 的会话：必须 403（此前会 200 放行）===')
if (opsSessionId) {
  const r = await call(adminTok, 'GET', `/v2/sessions/${opsSessionId}`)
  chk('admin 读 ops 会话详情被拒', r.status >= 400, `HTTP ${r.status}`)
  const w = await call(adminTok, 'PUT', `/v2/sessions/${opsSessionId}`, { title: 'hijacked' })
  chk('admin 改 ops 会话被拒', w.status >= 400, `HTTP ${w.status}`)
  const d = await call(adminTok, 'DELETE', `/v2/sessions/${opsSessionId}`)
  chk('admin 删 ops 会话被拒', d.status >= 400, `HTTP ${d.status}`)
} else {
  fail.push('ops 会话未创建，后续越权用例无意义')
}

console.log('\n=== 3. 会话列表不串号 ===')
const aList = await call(adminTok, 'GET', '/v2/sessions?limit=200')
const oList = await call(opsTok, 'GET', '/v2/sessions?limit=200')
const aItems = aList.json?.data?.items ?? []
const oItems = oList.json?.data?.items ?? []
const aIds = new Set(aItems.map((s) => String(s.id)))
const overlap = oItems.filter((s) => aIds.has(String(s.id)))
chk('admin 列表里没有 ops 的会话', overlap.length === 0, `admin=${aItems.length} ops=${oItems.length} overlap=${overlap.length}`)
chk('admin 列表非空（证明不是「空列表碰巧没串」）', aItems.length > 0, `admin=${aItems.length}`)
chk('ops 列表非空（证明上面不是空集假阴性）', oItems.length > 0, `ops=${oItems.length}`)

console.log('\n=== 4. 侧栏（分组 + 会话）不串号 ===')
const aSide = await call(adminTok, 'GET', '/v2/sessions/sidebar?limit=100')
const oSide = await call(opsTok, 'GET', '/v2/sessions/sidebar?limit=100')
const aSideIds = new Set(
  (aSide.json?.data?.groupSessions ?? []).flatMap((g) => (g.items ?? []).map((s) => String(s.id))),
)
const oSideIds = (oSide.json?.data?.groupSessions ?? []).flatMap((g) => (g.items ?? []).map((s) => String(s.id)))
const sideOverlap = oSideIds.filter((id) => aSideIds.has(String(id)))
chk('侧栏会话不串号', sideOverlap.length === 0, `overlap=${sideOverlap.length}`)

console.log('\n=== 5. 归档管理不串号 ===')
const aArc = await call(adminTok, 'GET', '/v2/ai/sessions/archived?limit=200')
const oArc = await call(opsTok, 'GET', '/v2/ai/sessions/archived?limit=200')
const aArcIds = new Set((aArc.json?.data?.items ?? []).map((s) => String(s.id)))
const arcOverlap = (oArc.json?.data?.items ?? []).filter((s) => aArcIds.has(String(s.id)))
chk('归档列表不串号', arcOverlap.length === 0, `overlap=${arcOverlap.length}`)

console.log('\n=== 6. 设置中心仍按用户隔离（不是管理员特权）===')
// 先由 ops 写一条覆盖，再看 admin 是否受影响
const opsOv = await call(opsTok, 'PUT', '/v2/settings/session/overrides', { ai_next_task_max: 7 })
chk('ops 能写自己的 session 覆盖', opsOv.status < 400, `HTTP ${opsOv.status}`)
const adminMerged = await call(adminTok, 'GET', '/v2/settings/session/merged')
// merged 是双层信封：{code,data:{success,data:[...]}}；对数组/对象两种形态都兜住
const mergedItems = (raw) => {
  const first = raw?.data ?? raw
  if (Array.isArray(first)) return first
  if (Array.isArray(first?.data)) return first.data
  return []
}
const aMax = mergedItems(adminMerged.json).find((i) => i?.field === 'ai_next_task_max')
chk('admin 的 session/ai_next_task_max 不受 ops 影响', String(aMax?.value) !== '7', `admin=${aMax?.value} default=${aMax?.defaultValue}`)

console.log('\n=== 7. admin 在设置中心仍保有管理员能力（不能一起削掉）===')
const mk = await call(adminTok, 'GET', '/v2/manufacturer-key/list')
chk('admin 仍可访问管理员专属面', mk.status < 400, `HTTP ${mk.status}`)
const mkOps = await call(opsTok, 'GET', '/v2/manufacturer-key/list')
chk('ops 仍被拒管理员专属面', mkOps.status >= 400, `HTTP ${mkOps.status}`)

console.log('\n=== 8. 清理：删掉 ops 的探针会话 ===')
if (opsSessionId) {
  const c = await call(opsTok, 'DELETE', `/v2/sessions/${opsSessionId}`)
  chk('ops 清理自己的探针会话', c.status < 400, `HTTP ${c.status}`)
}

console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}