/**
 * Non-admin (ops) acceptance for the tool-permission gate and the settings lockdown.
 *
 * This is the part I could only claim by code review before: no non-admin account
 * was available. The `ops` temp account resolves to role OPS with no permissions
 * (see StaticTempLogin), i.e. a genuine non-admin.
 *
 * Checks:
 *  1. ops logs in and is NOT admin
 *  2. the switch is invisible to ops in the definitions (adminOnly filtered)
 *  3. the switch value is absent from ops' group-settings view
 *  4. ops cannot write the switch  (PUT /settings/runtime)          -> 403
 *  5. ops cannot write the bypass   (PUT /settings/runtime/overrides) -> 403
 *  6. ops cannot relocate the workspace base (PUT /settings/system)  -> 403
 *  7. ops CAN write personal preferences (appearance / browser)      -> 200
 *  8. admin still sees the switch and can write it                   -> 200
 */
const API = 'http://192.168.50.198:8787'
const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(name)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}
const login = async (u, p) => {
  const r = await fetch(`${API}/v2/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) })
  const j = await r.json().catch(() => ({}))
  return { http: r.status, token: j?.data?.accessToken, raw: j }
}
const unwrap = (j) => j?.data?.data ?? j?.data ?? j
const H = (t) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${t}` })

console.log('=== 1. ops 登录并确认是非管理员 ===')
const ops = await login('ops', 'ops123')
console.log(`  ops 登录 HTTP ${ops.http}  token=${ops.token ? 'ok' : '无'}`)
chk('ops 能登录', !!ops.token)
const opsRole = ops.raw?.data?.user?.role ?? ops.raw?.user?.role
console.log(`  ops 角色 = ${opsRole}`)
chk('ops 不是管理员', String(opsRole).toUpperCase() !== 'ADMIN' && String(opsRole).toUpperCase() !== 'SUPER_ADMIN', String(opsRole))
if (!ops.token) process.exit(2)

console.log('\n=== 2. 开关在 ops 视角下应不可见（定义出口） ===')
const d = await fetch(`${API}/v2/global-setting-definitions`, { headers: H(ops.token) })
const dj = unwrap(await d.json())
const rt = (dj ?? []).find((g) => g.group === 'runtime')
const item = (rt?.items ?? []).find((i) => i.field === 'user_tool_access')
console.log(`  runtime 项数=${(rt?.items ?? []).length}  user_tool_access=${item ? '仍可见' : '已隐藏'}`)
chk('定义出口已对 ops 隐藏该开关', !item)

console.log('\n=== 3. 取值出口应剔除该开关 ===')
const g = await fetch(`${API}/v2/settings/runtime`, { headers: H(ops.token) })
const gj = unwrap(await g.json())
const has = Object.prototype.hasOwnProperty.call(gj ?? {}, 'user_tool_access')
console.log(`  ops 的 runtime 视野含该字段: ${has}`)
chk('取值出口已剔除该字段', !has)

console.log('\n=== 4/5. ops 写开关 —— 两条路都必须 403 ===')
const put1 = await fetch(`${API}/v2/settings/runtime`, { method: 'PUT', headers: H(ops.token), body: JSON.stringify({ user_tool_access: 'true' }) })
console.log(`  PUT /settings/runtime            -> HTTP ${put1.status}`)
chk('ops 写不了开关（正路被拒）', put1.status === 403, String(put1.status))
const put2 = await fetch(`${API}/v2/settings/runtime/overrides`, { method: 'PUT', headers: H(ops.token), body: JSON.stringify({ user_tool_access: 'true' }) })
console.log(`  PUT /settings/runtime/overrides  -> HTTP ${put2.status}`)
chk('ops 走旁路也写不了（overrides 同样被拒）', put2.status === 403, String(put2.status))

console.log('\n=== 6. ops 不能挪工作间基路径 ===')
const put3 = await fetch(`${API}/v2/settings/system`, { method: 'PUT', headers: H(ops.token), body: JSON.stringify({ workspaceBaseDir: '/tmp/evil' }) })
console.log(`  PUT /settings/system -> HTTP ${put3.status}`)
chk('ops 改不了 workspaceBaseDir', put3.status === 403, String(put3.status))

console.log('\n=== 7. ops 仍能写纯个人偏好 ===')
const ok1 = await fetch(`${API}/v2/settings/appearance`, { method: 'PUT', headers: H(ops.token), body: JSON.stringify({ language: 'zh-CN' }) })
console.log(`  PUT /settings/appearance -> HTTP ${ok1.status}`)
chk('appearance 仍然可写', ok1.status === 200, String(ok1.status))
const ok2 = await fetch(`${API}/v2/settings/browser`, { method: 'PUT', headers: H(ops.token), body: JSON.stringify({ linkOpenMode: 'browser' }) })
console.log(`  PUT /settings/browser    -> HTTP ${ok2.status}`)
chk('browser 仍然可写', ok2.status === 200, String(ok2.status))

console.log('\n=== 8. 管理员不受影响 ===')
const adm = await login('admin', 'admin123')
const ad = await fetch(`${API}/v2/global-setting-definitions`, { headers: H(adm.token) })
const adj = unwrap(await ad.json())
const art = (adj ?? []).find((x) => x.group === 'runtime')
const aitem = (art?.items ?? []).find((i) => i.field === 'user_tool_access')
chk('管理员仍能看到该开关', !!aitem && aitem.adminOnly === true, aitem ? `adminOnly=${aitem.adminOnly}` : '(隐藏了)')
const aput = await fetch(`${API}/v2/settings/runtime`, { method: 'PUT', headers: H(adm.token), body: JSON.stringify({ user_tool_access: 'false' }) })
console.log(`  管理员 PUT /settings/runtime -> HTTP ${aput.status}`)
chk('管理员仍能改该开关', aput.status === 200, String(aput.status))

console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}
