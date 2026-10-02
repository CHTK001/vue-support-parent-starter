/**
 * Bounded load / steady-state acceptance for the ai-guada backend.
 *
 * Why: the sign-off lists "long-run / soak" as unverified. This is deliberately
 * NOT a long soak -- the target is a SHARED production instance other sessions
 * use, so the load is kept modest and time-bounded. It answers two questions:
 *   1. under concurrent reads, does latency stay sane and error-free?
 *   2. does a real generation still complete while that load is in flight?
 *
 * Read phase: C workers x K iterations over the list + models endpoints.
 * Write phase: one real image task polled to SUCCESS. Requires the controllable
 * mock upstream on the backend host (port 18099) plus the acc-probe provider /
 * acc-image-probe model; auth on /v1/videos does not gate the image endpoint.
 *   bash /home/kali/mockctl2.sh start acc-probe-key   # before
 *   bash /home/kali/mockctl2.sh stop                   # after
 * Without it the task ends FAILED and this suite reports that honestly.
 *
 * Chinese expectations are \uXXXX escapes so this file stays pure ASCII.
 */
const API = process.env.AI_API || 'http://192.168.50.198:8787'
const CONCURRENCY = Number(process.env.AI_LOAD_C || 6)
const ITERATIONS = Number(process.env.AI_LOAD_K || 12)

const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(name)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pct = (arr, p) => {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}

const token = (
  await (
    await fetch(`${API}/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    })
  ).json()
).data?.accessToken
chk('login', !!token)
if (!token) process.exit(1)
const H = { Authorization: `Bearer ${token}` }

console.log(`=== read phase: ${CONCURRENCY} workers x ${ITERATIONS} iterations ===`)
const lat = []
let http5xx = 0
let netErr = 0
let inlineBase64 = 0
let bodies = []
const t0 = Date.now()
const worker = async (w) => {
  for (let i = 0; i < ITERATIONS; i++) {
    for (const url of [
      `${API}/v2/ai/generate/tasks?type=image&limit=30&offset=0`,
      `${API}/v2/ai/generate/models?type=image`,
      `${API}/v2/ai/generate/models?type=video`,
    ]) {
      const s = Date.now()
      try {
        const r = await fetch(url, { headers: H })
        const txt = await r.text()
        lat.push(Date.now() - s)
        if (r.status >= 500) http5xx++
        if (txt.includes('data:image/')) inlineBase64++
        if (url.endsWith('limit=30&offset=0')) bodies.push(txt.length)
      } catch {
        netErr++
      }
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, (_, w) => worker(w)))
const elapsed = Date.now() - t0
const total = CONCURRENCY * ITERATIONS * 3
console.log(
  `  ${total} requests in ${(elapsed / 1000).toFixed(1)}s  ` +
    `p50=${pct(lat, 50)}ms p95=${pct(lat, 95)}ms max=${Math.max(0, ...lat)}ms  ` +
    `5xx=${http5xx} netErr=${netErr}`,
)
chk('no 5xx during load', http5xx === 0, `${http5xx}`)
chk('no network errors', netErr === 0, `${netErr}`)
chk('p95 latency under 1000ms', pct(lat, 95) < 1000, `p95=${pct(lat, 95)}ms`)
chk('no inline base64 in list responses', inlineBase64 === 0, `${inlineBase64} occurrences`)
chk('list bodies stay small', Math.max(0, ...bodies) < 200 * 1024, `max=${Math.max(0, ...bodies)}B`)

console.log('=== write phase: one real image task, under/after the load ===')
const models = (await (await fetch(`${API}/v2/ai/generate/models?type=image`, { headers: H })).json()).data ?? []
const probe = models.find((m) => m.model === 'acc-image-probe')
const chosen = process.env.AI_LOAD_MODEL || (probe ? probe.model : models[0]?.model)
console.log(`  model = ${chosen}  (acc-image-probe present=${!!probe})`)
const prompt = `ai-load-${Date.now()}`
const c = await fetch(`${API}/v2/ai/generate/tasks`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'image', model: chosen, prompt, size: '1024x1024', count: 1 }),
})
const cj = await c.json()
const id = cj?.data?.taskId
chk('create accepted', !!id, `http=${c.status}`)
let last = null
const wt0 = Date.now()
for (let i = 0; i < 40 && id; i++) {
  const r = await fetch(`${API}/v2/ai/generate/tasks/${encodeURIComponent(id)}`, { headers: H })
  last = (await r.json())?.data
  if (/SUCCESS|FAILED|CANCELED/i.test(String(last?.status))) break
  await sleep(3000)
}
console.log(
  `  terminal=${last?.status} in ${((Date.now() - wt0) / 1000).toFixed(1)}s  urls=${(last?.urls ?? []).length}  err=${String(last?.errorMessage || '-').slice(0, 60)}`,
)
// Assert SUCCESS, not merely "a terminal state": FAILED is terminal too and would
// let a broken upstream pass this suite silently.
chk('the generation SUCCEEDED under load', String(last?.status).toUpperCase() === 'SUCCESS', String(last?.status))
chk('the successful task carries a url', (last?.urls ?? []).length === 1, JSON.stringify(last?.urls ?? []))

console.log('=== post-load health ===')
const h = await fetch(`${API}/v2/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
})
chk('backend still answers after load', h.status === 200, `http=${h.status}`)

if (id) {
  const d = await fetch(`${API}/v2/ai/generate/tasks/${encodeURIComponent(id)}`, { method: 'DELETE', headers: H })
  console.log(`  (cleanup ${last?.status}: ${id} -> http=${d.status})`)
}

console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}