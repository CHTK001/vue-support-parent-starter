/**
 * Verify the two static accounts.
 *
 * 1. admin/admin123 -> admin permission + SUPER_ADMIN role, full access
 * 2. ops/Ops@Guada2026 -> role OPS, NO admin permission
 * 3. the admin-only surface must REFUSE ops (that is the property that matters;
 *    just logging in proves nothing about the boundary)
 * 4. data isolation: userId == username, so each account owns its own records
 */
const API = 'http://192.168.50.198:8787'

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
  return { http: r.status, success: j?.success, code: j?.code, msg: j?.msg, data: j?.data }
}

console.log('=== 1. admin/admin123 ===')
const a = await login('admin', 'admin123')
const aTok = a.data?.accessToken
console.log(`  success=${a.success} roles=${JSON.stringify(a.data?.roles)}`)
chk('admin can log in', a.success === true && !!aTok, `code=${a.code}`)
chk('admin has the admin role', JSON.stringify(a.data?.roles ?? []).toLowerCase().includes('admin'), JSON.stringify(a.data?.roles))

console.log('\n=== 2. ops/Ops@Guada2026 ===')
const o = await login('ops', 'Ops@Guada2026')
const oTok = o.data?.accessToken
console.log(`  success=${o.success} roles=${JSON.stringify(o.data?.roles)} userId=${o.data?.userId}`)
chk('ops can log in', o.success === true && !!oTok, `code=${o.code}`)
chk('ops does NOT get the admin role', !JSON.stringify(o.data?.roles ?? []).toLowerCase().includes('super_admin'), JSON.stringify(o.data?.roles))
chk('ops userId is its own name (data isolation)', o.data?.userId === 'ops', String(o.data?.userId))

console.log('\n=== 3. 错误口令仍被拒（两个账号都要）===')
for (const [u, p] of [['admin', 'wrong'], ['ops', 'wrong']]) {
  const bad = await login(u, p)
  chk(`${u} 错口令拿不到令牌`, bad.success === false && !bad.data?.accessToken, `code=${bad.code}`)
}

console.log('\n=== 4. admin-only 面必须拒绝 ops ===')
// 只列**读代码确认过带 @Permission("admin")** 的端点。
// 之前这里是我按「看起来像管理面」猜的三个，实测它们只做登录校验、不做 admin 校验，
// 于是把「非管理员访问成功」误报成权限漏洞 —— 是取样错，不是权限错。
console.log(`  ops 的权限明细: permission=${JSON.stringify(o.data?.permission)} roles=${JSON.stringify(o.data?.roles)}`)
const adminOnlyProbes = [
  ['GET', '/v2/manufacturer-key/list'],
]
for (const [method, path] of adminOnlyProbes) {
  const rA = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${aTok}` } })
  const rO = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${oTok}` } })
  console.log(`  ${method} ${path}  admin=${rA.status}  ops=${rO.status}`)
  chk(`admin 可访问 ${path}`, rA.status < 400, `HTTP ${rA.status}`)
  chk(`ops 被拒 ${path}`, rO.status >= 400, `HTTP ${rO.status}`)
}

console.log('\n=== 5. 数据隔离：各账号只看到自己的记录 ===')
const listFor = async (tok) =>
  (await (await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=50&offset=0`, { headers: { Authorization: `Bearer ${tok}` } })).json()).data ?? []
const aRows = await listFor(aTok)
const oRows = await listFor(oTok)
console.log(`  admin 看到 ${aRows.length} 条，ops 看到 ${oRows.length} 条`)
chk('ops 看不到 admin 的记录', oRows.length === 0 || !oRows.some((r) => aRows.some((x) => x.taskId === r.taskId)), `overlap=${oRows.filter((r) => aRows.some((x) => x.taskId === r.taskId)).length}`)

console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
