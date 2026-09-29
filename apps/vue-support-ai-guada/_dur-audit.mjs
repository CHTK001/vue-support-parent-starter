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
const list = async (ty) => (await (await fetch(`${API}/v2/ai/generate/tasks?type=${ty}&limit=40&offset=0`, { headers: H })).json()).data ?? []

for (const ty of ['video', 'image']) {
  const rows = await list(ty)
  console.log(`--- ${ty} (${rows.length} rows) ---`)
  let missingSize = 0
  let missingDur = 0
  for (const t of rows) {
    const bad = t.status !== 'SUCCESS' ? ' <== 非成功' : ''
    if (!t.size) missingSize++
    if (ty === 'video' && !t.duration) missingDur++
  }
  console.log(`  size 为空的行: ${missingSize}/${rows.length}`)
  if (ty === 'video') console.log(`  duration 为空的行: ${missingDur}/${rows.length}`)
  for (const t of rows.slice(0, 6)) {
    console.log(
      `  ${t.status.padEnd(8)} size=${String(t.size ?? 'NULL').padEnd(10)} dur=${String(t.duration ?? 'NULL').padEnd(5)} urls=${(t.urls ?? []).length} prompt=${(t.prompt || '').slice(0, 22)}`,
    )
  }
}
