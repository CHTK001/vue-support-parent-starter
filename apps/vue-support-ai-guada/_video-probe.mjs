/**
 * Video pipeline probe, end to end.
 *
 * Watches a video task from submit to terminal and reports every state
 * transition, so we can tell apart:
 *   - accepted upstream + stays PENDING (queue saturated, never progresses)
 *   - accepted upstream + reaches SUCCESS with a real media url
 *   - rejected upstream (rate limit / queue full) -> FAILED with our Chinese text
 *
 * Also records the poll URL shape, because the degraded Agnes path and the
 * standard path use different endpoints and we need to know which one ran.
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

const list = async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=20&offset=0`, { headers: H })).json()).data ?? []
const running = (t) => t.status === 'PENDING' || t.status === 'RUNNING'

console.log('=== 1. video catalog ===')
const models = (await (await fetch(`${API}/v2/ai/generate/models?type=video`, { headers: H })).json()).data ?? []
for (const m of models) {
  console.log(`  model=${m.model} alias=${m.alias}`)
  console.log(`    durations=${JSON.stringify(m.config?.durations)} maxCount=${m.config?.maxCount}`)
  console.log(`    sizes=${JSON.stringify(m.config?.sizes)} referenceImage=${m.config?.referenceImage}`)
  console.log(`    styles=${JSON.stringify(m.config?.styles)}`)
}

console.log('\n=== 2. clear any leftover unfinished video task ===')
for (const t of (await list('video')).filter(running)) {
  const r = await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
  console.log(`  canceled ${t.taskId} -> HTTP ${r.status}`)
}
console.log(`  unfinished before submit = ${(await list('video')).filter(running).length}`)

console.log('\n=== 3. submit a video task ===')
const size = models[0]?.config?.sizes?.[0] ?? '1280x720'
const dur = models[0]?.config?.durations?.[0] ?? 4
const body = { type: 'video', model: models[0]?.model, prompt: 'video pipeline probe', size, duration: dur }
console.log(`  body = ${JSON.stringify(body)}`)
const sub = await (await fetch(`${API}/v2/ai/generate/tasks`, { method: 'POST', headers: H, body: JSON.stringify(body) })).json()
console.log(`  http-code=${sub.code} msg=${sub.msg} taskId=${sub.data?.taskId}`)
const id = sub.data?.taskId
if (!id) {
  console.log('  submit did not return a task id; stopping')
  process.exit(2)
}

console.log('\n=== 4. watch every transition ===')
const seen = new Set()
let final = null
for (let i = 0; i < 90; i++) {
  await sleep(4000)
  const t = (await list('video')).find((x) => x.taskId === id)
  if (!t) {
    console.log(`  [${(i + 1) * 4}s] GONE (deleted?)`)
    break
  }
  const key = `${t.status}|${t.progress ?? 0}`
  if (!seen.has(key)) {
    seen.add(key)
    console.log(`  [${(i + 1) * 4}s] ${t.status} progress=${t.progress ?? 0} urls=${(t.urls ?? []).length} elapsed=${t.elapsedMillis ?? '-'} err=${(t.errorMessage || '-').slice(0, 70)}`)
  }
  if (!running(t)) {
    final = t
    break
  }
}

console.log('\n=== 5. outcome ===')
if (!final) {
  const t = (await list('video')).find((x) => x.taskId === id)
  console.log(`  STILL RUNNING after 6 minutes: status=${t?.status} progress=${t?.progress}`)
  console.log('  -> the upstream accepted it but never finishes (queue saturated)')
} else {
  console.log(`  status=${final.status} elapsed=${final.elapsedMillis ?? '-'}ms`)
  console.log(`  urls=${JSON.stringify(final.urls ?? [])}`)
  console.log(`  errorMessage=${final.errorMessage || '(none)'}`)
  if (final.status === 'SUCCESS' && (final.urls ?? []).length) {
    console.log('  SUCCESS PATH EXERCISED')
    const u = final.urls[0]
    if (u.startsWith('/v2/ai/generate/tasks/')) {
      const r = await fetch(`${API}${u}?x-oauth-token=${encodeURIComponent(token)}`)
      const b = await r.arrayBuffer()
      console.log(`  media fetch: HTTP ${r.status} bytes=${b.byteLength} type=${r.headers.get('content-type')}`)
    } else {
      console.log(`  url is a direct address: ${u.slice(0, 90)}`)
    }
  }
}
