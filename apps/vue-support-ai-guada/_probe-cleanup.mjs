/**
 * Confirm the probe task's reference is already unreachable (orphaned by the
 * base-path change, because its handle predates the fix), then remove my test
 * artifacts: the record and the probe directory.
 */
const API = 'http://192.168.50.198:8787'
const token = (
  await (
    await fetch(`${API}/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    })
  ).json()
).data.accessToken
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
const id = 'sync-7e3efe35-64ec-4052-af20-38e065cd15f1'

const r = await fetch(`${API}/v2/ai/generate/tasks/${id}`, { headers: H })
const j = await r.json()
const row = j?.data
console.log(`  记录存在: ${!!row}`)
if (!row) process.exit(0)
console.log(`  status = ${row.status}   prompt = ${row.prompt}`)
console.log(`  referenceImage = ${row.referenceImage}`)

const m = await fetch(`${API}${row.referenceImage}?x-oauth-token=${encodeURIComponent(token)}`)
console.log(`  读参考图: HTTP ${m.status}  ${m.status === 404 ? '已被孤立（文件在当前基路径下不可达）' : '仍可读'}`)

if (m.status === 404) {
  console.log('\n  => 该引用已不可达，磁盘上那份文件是收不到的东西，可安全随探针目录一起删。')
  console.log('  删除这条探针记录（prompt 以 basepath probe 开头，是我造的测试数据）')
  const d = await fetch(`${API}/v2/ai/generate/tasks/${id}`, { method: 'DELETE', headers: H })
  console.log(`  DELETE -> HTTP ${d.status}`)
} else {
  console.log('\n  => 引用仍可读，不能删该文件；将只删除记录，保留文件')
  const d = await fetch(`${API}/v2/ai/generate/tasks/${id}`, { method: 'DELETE', headers: H })
  console.log(`  DELETE -> HTTP ${d.status}`)
}
