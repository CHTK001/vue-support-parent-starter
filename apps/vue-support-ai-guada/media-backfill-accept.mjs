/**
 * Run the legacy inline-media backfill and verify nothing was lost.
 * Re-created after the earlier copy was cleaned up with the commit.
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const list = async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=30&offset=0`, { headers: H })).json()).data ?? []
const running = (t) => t.status === 'PENDING' || t.status === 'RUNNING'
const backfill = async (dryRun) => {
  const r = await fetch(`${API}/v2/ai/generate/tasks/media/backfill?dryRun=${dryRun}`, { method: 'POST', headers: H })
  const j = await r.json()
  return { http: r.status, ...(j.data ?? {}), msg: j.msg }
}
const timeList = async () => {
  const t0 = performance.now()
  const r = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`, { headers: H })
  const buf = await r.arrayBuffer()
  return `${(performance.now() - t0).toFixed(0)}ms/${buf.byteLength}B`
}

for (const t of (await list('image')).filter(running)) {
  await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
}
console.log('=== list timing before backfill ===')
console.log(`  ${await timeList()}  ${await timeList()}  ${await timeList()}`)

console.log('\n=== dry run ===')
const dry = await backfill(true)
console.log(`  ${JSON.stringify(dry)}`)

console.log('\n=== real run ===')
const real = await backfill(false)
console.log(`  ${JSON.stringify(real)}`)

console.log('\n=== second real run (should now find nothing: idempotent) ===')
console.log(`  ${JSON.stringify(await backfill(false))}`)

console.log('\n=== list timing after backfill ===')
console.log(`  ${await timeList()}  ${await timeList()}  ${await timeList()}`)

console.log('\n=== media integrity sweep ===')
const rows = await list('image')
let tried = 0
let ok = 0
const bad = []
for (const t of rows) {
  const urls = [...(t.urls ?? [])]
  if (t.referenceImage && t.referenceImage.startsWith('/v2/ai/generate/tasks/')) {
    urls.push(t.referenceImage)
  }
  for (const u of urls) {
    if (!u.startsWith('/v2/ai/generate/tasks/')) {
      continue
    }
    tried++
    const r = await fetch(`${API}${u}?x-oauth-token=${encodeURIComponent(token)}`)
    const n = (await r.arrayBuffer()).byteLength
    if (r.status === 200 && n > 1000) {
      ok++
    } else {
      bad.push(`${t.taskId} HTTP ${r.status} ${n}B ${u.slice(-28)}`)
    }
  }
}
console.log(`  probed ${tried}, served ${ok}, broken ${bad.length}`)
bad.slice(0, 8).forEach((b) => console.log(`    BROKEN ${b}`))
console.log(`\n=== VERDICT: ${tried > 0 && ok === tried ? 'ALL MEDIA INTACT' : 'BROKEN PRESENT'} ===`)
await sleep(300)
console.log('\n=== list has no inline base64 ===')
const body = await (await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`, { headers: H })).text()
console.log(`  data:image occurrences = ${body.split('data:image').length - 1}, body = ${body.length} bytes`)
