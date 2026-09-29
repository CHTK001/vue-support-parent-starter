/**
 * Bounded retry of the video submit, looking for a queue window.
 *
 * The upstream has been answering 503 (queue full) / 429 (rate limited) for
 * hours. This retries with backoff for a bounded time and reports whether the
 * submit is ever *accepted upstream*.
 *
 * Acceptance criterion, and why it has to be this one: the async submit takes
 * ~1.5-4s before it either succeeds or writes FAILED. A previous version of
 * this probe checked "is it still PENDING at +3.5s" and produced a false
 * positive, because one submit took 3.6s to fail and the check landed inside
 * that window. The honest signal is that the row is *still* non-terminal well
 * past the submit window -- so we wait the row out for a generous budget and
 * only call it accepted if it never goes terminal within it.
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
const list = async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=10&offset=0`, { headers: H })).json()).data ?? []
const running = (t) => t.status === 'PENDING' || t.status === 'RUNNING'

const attempts = Number(process.argv[2] ?? 6)
const gapMs = Number(process.argv[3] ?? 15000)
const acceptWindowMs = Number(process.argv[4] ?? 45000)
console.log(`retry plan: up to ${attempts} submits, ${gapMs / 1000}s apart, ${acceptWindowMs / 1000}s acceptance window`)

let accepted = null
for (let i = 1; i <= attempts; i++) {
  for (const t of (await list('video')).filter(running)) {
    await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
  }
  const r = await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ type: 'video', model: 'agnes-video-2.5-flash', prompt: `video retry ${i}`, size: '1280x720', duration: 4 }),
  })
  const j = await r.json()
  const id = j.data?.taskId

  // Wait the row out: it either goes terminal (submit failed) or survives the
  // whole window (submit was accepted by the upstream).
  let t = null
  const deadline = Date.now() + acceptWindowMs
  while (Date.now() < deadline) {
    await sleep(3000)
    t = (await list('video')).find((x) => x.taskId === id)
    if (!t || !running(t)) break
  }
  const survived = !!t && running(t)
  console.log(
    `  [${i}/${attempts}] ${t ? `${t.status} p=${t.progress ?? 0} urls=${(t.urls ?? []).length}` : 'GONE'}` +
      `${survived ? '   <== ACCEPTED UPSTREAM (survived the whole window)' : ''}` +
      `  err=${(t?.errorMessage || '-').slice(0, 44)}`,
  )
  if (survived) {
    accepted = t
    break
  }
  if (i < attempts) await sleep(gapMs)
}

console.log('')
if (!accepted) {
  console.log(`RESULT: no queue window in ${attempts} attempts. The video success path stays unverifiable upstream-side.`)
  process.exit(2)
}

console.log(`RESULT: accepted upstream -> ${accepted.taskId}`)
console.log('polling it to terminal ...')
for (let i = 0; i < 100; i++) {
  await sleep(6000)
  const t = (await list('video')).find((x) => x.taskId === accepted.taskId)
  if (!t) { console.log('  GONE'); break }
  console.log(`  [${(i + 1) * 6}s] ${t.status} p=${t.progress ?? 0} urls=${(t.urls ?? []).length} err=${(t.errorMessage || '-').slice(0, 60)}`)
  if (!running(t)) {
    console.log('')
    console.log(`FINAL status=${t.status} elapsed=${t.elapsedMillis ?? '-'}ms`)
    console.log(`urls=${JSON.stringify(t.urls ?? [])}`)
    if ((t.urls ?? []).length) {
      const u = t.urls[0]
      console.log(`first url: ${u.slice(0, 120)}`)
      if (u.startsWith('/v2/ai/generate/tasks/')) {
        const r = await fetch(`${API}${u}?x-oauth-token=${encodeURIComponent(token)}`)
        console.log(`media fetch: HTTP ${r.status} bytes=${(await r.arrayBuffer()).byteLength} type=${r.headers.get('content-type')}`)
      }
      console.log('VIDEO SUCCESS PATH EXERCISED')
    }
    break
  }
}
