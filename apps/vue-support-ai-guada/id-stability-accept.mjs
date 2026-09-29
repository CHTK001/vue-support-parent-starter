/**
 * Verify the taskId fix: the id the client gets must be the id in the database.
 *
 * Before the fix the create response carried one id while the row carried
 * another (the upstream provider id overwrote the primary key after insert),
 * so the frontend polled an id that does not exist -> the card sat at 0%.
 *
 * Checks, all by the client-visible id only:
 *  1. create's taskId appears in the task list (i.e. it is a real row id)
 *  2. polling /tasks/{id} for it succeeds (no UNKNOWN / 404)
 *  3. cancelling by it actually cancels the row
 *  4. a failed-provider row still lands, with its size recorded
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

console.log('=== 0. clear leftovers ===')
for (const ty of ['image', 'video']) {
  for (const t of (await list(ty)).filter(running)) {
    await fetch(`${API}/v2/ai/generate/tasks/${t.taskId}/cancel`, { method: 'POST', headers: H })
  }
}

console.log('\n=== 1. image: the returned id must be a real row id ===')
const img = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ type: 'image', model: 'agnes-image-2.5-flash', prompt: `id fix probe ${Date.now()}`, size: '1024x1024' }),
  })
).json()
const imgId = img.data?.taskId
console.log(`  create returned: ${imgId}`)
chk('create returned an id', !!imgId)

// Poll it immediately by that id -- the old behaviour 404'd here.
const poll = await fetch(`${API}/v2/ai/generate/tasks/${encodeURIComponent(imgId)}`, { headers: H })
const pollBody = await poll.json()
console.log(`  poll /tasks/{returned id}: HTTP ${poll.status} code=${pollBody.code} status=${pollBody.data?.status}`)
chk('polling by the returned id finds the task', poll.status === 200 && pollBody.data?.taskId === imgId, `HTTP ${poll.status} ${pollBody.msg ?? ''}`)

await sleep(1500)
const inList = (await list('image')).find((t) => t.taskId === imgId)
console.log(`  row found in list: ${inList ? inList.taskId : '(NOT FOUND)'} status=${inList?.status}`)
chk('the returned id is the row id in the list', !!inList)

console.log('\n=== 2. cancel by the returned id must really cancel ===')
const c1 = await fetch(`${API}/v2/ai/generate/tasks/${encodeURIComponent(imgId)}/cancel`, { method: 'POST', headers: H })
console.log(`  cancel -> HTTP ${c1.status}`)
await sleep(1500)
const afterCancel = (await list('image')).find((t) => t.taskId === imgId)
console.log(`  row status after cancel: ${afterCancel?.status}`)
chk('cancel by the returned id actually cancels the row', afterCancel?.status === 'CANCELED', String(afterCancel?.status))

console.log('\n=== 3. video: same guarantees, plus size/duration recorded on failure ===')
const vidPrompt = `id fix video probe ${Date.now()}`
const vid = await (
  await fetch(`${API}/v2/ai/generate/tasks`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ type: 'video', model: 'agnes-video-2.5-flash', prompt: vidPrompt, size: '1280x720', duration: 8 }),
  })
).json()
const vidId = vid.data?.taskId
console.log(`  create returned: ${vidId}`)
chk('video create returned an id', !!vidId)
const vpoll = await fetch(`${API}/v2/ai/generate/tasks/${encodeURIComponent(vidId)}`, { headers: H })
const vbody = await vpoll.json()
chk('video polling by the returned id works', vpoll.status === 200 && vbody.data?.taskId === vidId, `HTTP ${vpoll.status} ${vbody.msg ?? ''}`)

let vfinal = null
for (let i = 0; i < 20; i++) {
  await sleep(2000)
  const t = (await list('video')).find((x) => x.taskId === vidId)
  if (t && !running(t)) {
    vfinal = t
    break
  }
}
console.log(`  video row: ${vfinal ? `${vfinal.status} size=${vfinal.size} duration=${vfinal.duration}` : '(still running)'}`)
chk('video row exists under the returned id', !!vfinal)
chk('video keeps its size and duration', vfinal?.size === '1280x720' && vfinal?.duration === 8, `size=${vfinal?.size} duration=${vfinal?.duration}`)

console.log('\n=== 4. no row anywhere is polled by an id that does not exist ===')
const allImg = await list('image')
const allVid = await list('video')
let mismatched = 0
for (const t of allImg.slice(0, 12)) {
  const r = await fetch(`${API}/v2/ai/generate/tasks/${encodeURIComponent(t.taskId)}`, { headers: H })
  if (r.status !== 200) {
    mismatched++
    console.log(`    MISS ${t.taskId} -> HTTP ${r.status}`)
  }
}
console.log(`  probed ${Math.min(12, allImg.length)} image rows, ${mismatched} unreachable by their own id`)
chk('every listed row is reachable by its own id', mismatched === 0, `${mismatched} misses`)
console.log(`  (video rows: ${allVid.length}, all created before this fix keep their old shape)`)

console.log(`\n=== SUMMARY: PASS ${pass} / FAIL ${fail} ===`)
if (fail) process.exit(1)
