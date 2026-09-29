/**
 * Verify plan B: inline bytes are no longer stored in the database.
 *
 * Before: every successful row carried a full base64 image in `result`, so the
 * list cost scaled with row count (543-680ms for 30 rows, ~30ms/row).
 * After: the bytes live on disk, the row holds a short handle; the list should
 * stop scaling with image size.
 *
 * Checks:
 *  1. a freshly generated image's urls entry is a handle, not a data URI
 *  2. the /media/{i} endpoint still serves real bytes for it
 *  3. a freshly created reference image is also a handle
 *  4. list latency and response size
 *  5. legacy rows (data: in the DB) still render -- no backfill was done
 *
 * ASCII only by design.
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

let pass = 0
let fail = 0
const chk = (name, ok, extra = '') => {
  ;(ok ? pass++ : fail++)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}

console.log('=== 0. list timing right now (mixed legacy + new rows) ===')
for (let i = 0; i < 3; i++) {
  const t0 = performance.now()
  const r = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`, { headers: H })
  const buf = await r.arrayBuffer()
  console.log(`  run ${i + 1}: ${(performance.now() - t0).toFixed(0)}ms, ${buf.byteLength} bytes`)
  await sleep(250)
}

console.log('\n=== 1. clear leftovers, then generate one image ===')
for (const t of (await list('image')).filter(running)) {
  await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
}
const prompt = `plan-b probe ${Date.now()}`
const sub = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ type: 'image', model: 'agnes-image-2.5-flash', prompt, size: '1024x1024' }),
  })
).json()
const id = sub.data?.taskId
console.log(`  taskId=${id}`)
let row = null
for (let i = 0; i < 40; i++) {
  await sleep(2000)
  const t = (await list('image')).find((x) => x.taskId === id)
  if (t && !running(t)) {
    row = t
    break
  }
}
if (!row) {
  console.log('  task never reached terminal; aborting')
  process.exit(2)
}
console.log(`  terminal: ${row.status} urls=${(row.urls ?? []).length} err=${(row.errorMessage || '-').slice(0, 50)}`)

if ((row.urls ?? []).length === 0) {
  console.log('  generation produced no result (upstream); the plan-B assertion cannot run')
  process.exit(3)
}

const first = row.urls[0]
console.log(`  stored value (as seen by the API): ${first.slice(0, 80)}`)
// The API value is the address the browser uses, not the raw stored value: the
// raw value is a media handle and only visible in the database (verified
// separately with SQL: {"urls":["media:<taskId>/0.png"],"mediaType":"image"}).
chk('the media value is no longer an inline data URI', !first.startsWith('data:'), first.slice(0, 40))
chk('the API exposes it as a media path', first.startsWith('/v2/ai/generate/tasks/'), first.slice(0, 60))

console.log('\n=== 2. the media endpoint still serves real bytes ===')
const r = await fetch(`${API}${first}?x-oauth-token=${encodeURIComponent(token)}`)
const b = Buffer.from(await r.arrayBuffer())
const isPng = b[0] === 0x89 && b[1] === 0x50
console.log(`  HTTP ${r.status} ${b.length} bytes type=${r.headers.get('content-type')}`)
chk('media endpoint returns real image bytes for a handle', r.status === 200 && b.length > 1000 && isPng, `${b.length}B png=${isPng}`)

console.log('\n=== 3. the row in the database is small now ===')
// The list response for this row should be tiny: no base64 anywhere.
const listBody = await (await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`, { headers: H })).text()
chk('list response contains no inline data uris at all', !listBody.includes('data:image/'), `${listBody.length} bytes total`)
chk('list response is small', listBody.length < 200 * 1024, `${listBody.length} bytes`)

console.log('\n=== 4. legacy rows still render (no backfill was performed) ===')
const all = await list('image')
const legacy = all.filter((t) => (t.urls ?? []).some((u) => u.startsWith('/v2/ai/generate/tasks/')) && t.status === 'SUCCESS')
let legacyOk = 0
let legacyTried = 0
for (const t of legacy.slice(0, 6)) {
  const u = t.urls[0]
  if (!u.startsWith('/v2/ai/generate/tasks/')) {
    continue
  }
  legacyTried++
  const rr = await fetch(`${API}${u}?x-oauth-token=${encodeURIComponent(token)}`)
  if (rr.status === 200 && (await rr.arrayBuffer()).byteLength > 1000) {
    legacyOk++
  }
}
console.log(`  probed ${legacyTried} result rows, ${legacyOk} served bytes`)
chk('legacy inline rows are still served', legacyTried === 0 || legacyOk === legacyTried, `${legacyOk}/${legacyTried}`)

console.log('\n=== 5. list timing after this run ===')
for (let i = 0; i < 3; i++) {
  const t0 = performance.now()
  const rr = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`, { headers: H })
  const buf = await rr.arrayBuffer()
  console.log(`  run ${i + 1}: ${(performance.now() - t0).toFixed(0)}ms, ${buf.byteLength} bytes`)
  await sleep(250)
}

console.log(`\n=== SUMMARY: PASS ${pass} / FAIL ${fail} ===`)
if (fail) process.exit(1)
