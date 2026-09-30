/**
 * ops 账号验收（加深版）。
 *
 * 上一版的数据隔离断言是「两边都看到 0 条 → 通过」，那等于没验。
 * 这里让 ops 真的建一条记录，再看 admin 能不能看到 —— 隔离必须用真实数据证明。
 *
 * 同时如实采下服务端返回的 permission / roles 两个字段：
 * 代码里 StaticTempLogin 只给用户名恰为 admin 的账号发 admin 权限与 SUPER_ADMIN 角色，
 * 而非 admin 账号应是 OPS 角色、无权限。实测 ops 返回的 roles 需要核对。
 */
const API = 'http://192.168.50.198:8787'
const pass = []
const fail = []
const chk = (n, ok, extra = '') => {
  ;(ok ? pass : fail).push(n)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? '  ' + extra : ''}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const login = async (username, password) => {
  const r = await fetch(`${API}/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return await r.json()
}
const listFor = async (tok) =>
  (await (await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=50&offset=0`, { headers: { Authorization: `Bearer ${tok}` } })).json()).data ?? []

console.log('=== 1. 两个账号都能登录，且身份字段可区分 ===')
const a = await login('admin', 'admin123')
const o = await login('ops', 'Ops@Guada2026')
chk('admin 登录', a?.success === true && !!a?.data?.accessToken, `code=${a?.code}`)
chk('ops   登录', o?.success === true && !!o?.data?.accessToken, `code=${o?.code}`)
console.log(`  admin: userId=${a?.data?.userId} roles=${JSON.stringify(a?.data?.roles)} permission=${JSON.stringify(a?.data?.permission)}`)
console.log(`  ops  : userId=${o?.data?.userId} roles=${JSON.stringify(o?.data?.roles)} permission=${JSON.stringify(o?.data?.permission)}`)
chk('两个账号 userId 不同（数据归属可区分）', a?.data?.userId === 'admin' && o?.data?.userId === 'ops', `${a?.data?.userId} vs ${o?.data?.userId}`)

const aTok = a.data.accessToken
const oTok = o.data.accessToken

console.log('\n=== 2. ops 能正常使用业务接口（不是只能登录）===')
const oList = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=5&offset=0`, { headers: { Authorization: `Bearer ${oTok}` } })
chk('ops 可读自己的任务列表', oList.status === 200, `HTTP ${oList.status}`)
const oModels = await fetch(`${API}/v2/ai/generate/models?type=image`, { headers: { Authorization: `Bearer ${oTok}` } })
chk('ops 可读模型清单', oModels.status === 200, `HTTP ${oModels.status}`)

console.log('\n=== 3. 真实数据隔离：ops 建一条，admin 不应看到 ===')
const beforeAdmin = await listFor(aTok)
const probe = `ops isolation probe ${Date.now()}`
const created = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oTok}` },
    body: JSON.stringify({ type: 'image', model: 'agnes-image-2.5-flash', prompt: probe, size: '1024x1024' }),
  })
).json()
const probeId = created?.data?.taskId
console.log(`  ops 建的 taskId = ${probeId}  msg=${created?.msg}`)
chk('ops 能创建任务', !!probeId, `code=${created?.code}`)

await sleep(2500)
const adminSees = (await listFor(aTok)).some((t) => t.taskId === probeId)
const opsSees = (await listFor(oTok)).some((t) => t.taskId === probeId)
console.log(`  admin 能看到: ${adminSees}   ops 能看到: ${opsSees}   (admin 之前有 ${beforeAdmin.length} 条)`)
chk('ops 能看到自己建的任务', opsSees === true)
chk('admin 看不到 ops 的任务', adminSees === false)

console.log('\n=== 4. 反向：admin 建的，ops 不应看到 ===')
const probe2 = `admin isolation probe ${Date.now()}`
const created2 = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aTok}` },
    body: JSON.stringify({ type: 'image', model: 'agnes-image-2.5-flash', prompt: probe2, size: '1024x1024' }),
  })
).json()
const probeId2 = created2?.data?.taskId
console.log(`  admin 建的 taskId = ${probeId2}  msg=${created2?.msg}`)
await sleep(2500)
const opsSees2 = (await listFor(oTok)).some((t) => t.taskId === probeId2)
console.log(`  ops 能看到 admin 的任务: ${opsSees2}`)
chk('ops 看不到 admin 的任务', opsSees2 === false)

console.log('\n=== 5. 权限边界：真带 @Permission("admin") 的端点必须拒绝 ops ===')
console.log('  （GET /v2/manufacturer-key/list 是读代码确认过带该注解的）')
const rA = await fetch(`${API}/v2/manufacturer-key/list`, { headers: { Authorization: `Bearer ${aTok}` } })
const rO = await fetch(`${API}/v2/manufacturer-key/list`, { headers: { Authorization: `Bearer ${oTok}` } })
console.log(`  admin=${rA.status}  ops=${rO.status}`)
chk('admin 可访问 admin-only 端点', rA.status < 400, `HTTP ${rA.status}`)
chk('ops 被 admin-only 端点拒绝', rO.status >= 400, `HTTP ${rO.status}`)

console.log('\n=== 6. 错口令 / 匿名 ===')
for (const [u, p] of [['admin', 'wrong'], ['ops', 'wrong']]) {
  const bad = await login(u, p)
  chk(`${u} 错口令拿不到令牌`, bad?.success === false && !bad?.data?.accessToken, `code=${bad?.code}`)
}
const anon = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=1&offset=0`)
chk('匿名请求被拒', anon.status === 403 || anon.status === 401, `HTTP ${anon.status}`)

console.log('\n=== 7. 清理本次探针记录 ===')
for (const [tok, id] of [[oTok, probeId], [aTok, probeId2]]) {
  if (!id) continue
  const r = await fetch(`${API}/v2/ai/generate/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok}` } })
  console.log(`  删 ${id} -> HTTP ${r.status}`)
}

console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}