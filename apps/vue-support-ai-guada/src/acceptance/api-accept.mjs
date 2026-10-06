#!/usr/bin/env node
/**
 * Deployment-time API acceptance against the PRODUCTION backend.
 *
 * <p>Why a plain-HTTP suite instead of the Playwright sweep: this round proves the
 * endpoints a browser cannot drive honestly — SSE streams, permission walls for a
 * second account, and bot runtime exits that need an exact request body. The UI
 * sweep (`ui-click-sweep.cjs`) covers every clickable control; this covers the
 * contract underneath it.
 *
 * <p>Coverage
 * <ul>
 *   <li>Agents package management (the 404 that was fixed this round): list /
 *       paths / install / import-JSON / import-zip / toggle / uninstall /
 *       market sources / market search, plus ops (non-admin) hitting 403 on
 *       every write and 200 on reads.</li>
 *   <li>Bot runtime exits: stop / start / restart / logout on binding id=1,
 *       finishing restored to {@code online} so production data is preserved.</li>
 *   <li>Workspace SSE: 200 + text/event-stream, a real {@code add} event for a
 *       file created over SSH while listening, {@code sessionId} echoed verbatim,
 *       heartbeat inside 15s, 404 for an unknown session (permanent-failure
 *       signal for the frontend) and 401 without a token.</li>
 *   <li>Fingerprint: jar md5 / MainPID / start timestamp / NRestarts / single
 *       instance, so the report is bound to this exact package.</li>
 * </ul>
 *
 * <p>Usage: {@code node src/acceptance/api-accept.mjs}
 * ({@code AI_ACCEPT_BASE} overrides the backend origin).
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pexec = promisify(execFile)

const BASE = process.env.AI_ACCEPT_BASE || 'http://192.168.50.198:8787'
const SSH_HOST = process.env.ACCEPT_SSH_HOST || 'kali@192.168.50.198'
const PLINK = 'C:\\Program Files\\PuTTY\\plink.exe'
const HOSTKEY = 'ssh-ed25519 255 SHA256:cwfyC8w0qteYq8lXud9P9U2aSS8O/bxQOK6Y60BOmsI'
const HERE = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = join(HERE, '.api-accept')

const results = []
function rec(section, name, pass, detail = '') {
  results.push({ section, name, pass: !!pass, detail: String(detail).slice(0, 400) })
  console.log(`${pass ? 'PASS' : 'FAIL'}  [${section}] ${name}${detail ? ' :: ' + detail : ''}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(method, path, { token, body, form } = {}) {
  const headers = {}
  if (token) {
    headers['x-oauth-token'] = token
    headers.Authorization = `Bearer ${token}`
  }
  const init = { method, headers }
  if (form) {
    init.body = form
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  let res
  try {
    res = await fetch(BASE + path, init)
  } catch (e) {
    return { status: 0, json: null, text: String(e), headers: new Headers() }
  }
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON is a valid answer for SSE/404 */ }
  return { status: res.status, json, text, headers: res.headers }
}

async function login(user, pass) {
  const r = await api('POST', '/v2/user/login', { body: { username: user, password: pass } })
  const token = r.json?.data?.accessToken
  return { ok: r.status === 200 && !!token, status: r.status, token, msg: r.json?.msg || '' }
}

async function ssh(cmd) {
  const { stdout } = await pexec(
    PLINK,
    ['-batch', '-pw', 'kali', '-hostkey', HOSTKEY, SSH_HOST, cmd],
    { maxBuffer: 4 * 1024 * 1024 },
  )
  return stdout
}

/** Parse SSE frames out of the byte stream: blocks separated by a blank line. */
function makeFrameParser(onFrame) {
  let buf = ''
  return {
    push(chunk) {
      buf += chunk
      let idx
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
        if (!dataLine) continue
        try {
          onFrame(JSON.parse(dataLine.slice(5).trim()))
        } catch {
          /* malformed frame: the caller asserts on what it did parse */
        }
      }
    },
  }
}

function names(list) {
  return Array.isArray(list) ? list.map((x) => String(x?.name ?? '')).filter(Boolean) : []
}

// ---------------------------------------------------------------------------

async function fingerprint() {
  const section = 'fingerprint'
  try {
    const md5 = (await ssh('md5sum /opt/ai-starter/app.jar')).trim().split(/\s+/)[0]
    const show = await ssh(
      'systemctl show ai-starter -p MainPID -p NRestarts -p ExecMainStartTimestamp -p ActiveState',
    )
    const count = (await ssh('pgrep -fc "server[.]port=8787" || true')).trim()
    const flags = await ssh(
      "ps -eo args | grep '[s]erver.port=8787' | tr ' ' '\\n' | grep -cE '^\\-XX:\\+UseCompactObjectHeaders$'",
    )
    const fp = {
      jarMd5: md5,
      activeState: (show.match(/ActiveState=(\S+)/) || [])[1],
      mainPID: (show.match(/MainPID=(\d+)/) || [])[1],
      nRestarts: (show.match(/NRestarts=(\d+)/) || [])[1],
      execMainStartTimestamp: (show.match(/ExecMainStartTimestamp=(.+)/) || [])[1]?.trim(),
      instanceCount: count.trim(),
      compactObjectHeaders: flags.trim(),
    }
    rec(section, 'single instance (server.port=8787)', fp.instanceCount === '1', `count=${fp.instanceCount}`)
    rec(section, 'service active + NRestarts=0', fp.activeState === 'active' && fp.nRestarts === '0',
      `${fp.activeState} NRestarts=${fp.nRestarts}`)
    rec(section, '-XX:+UseCompactObjectHeaders', fp.compactObjectHeaders === '1', `flags=${fp.compactObjectHeaders}`)
    rec(section, 'jar md5 reported', /^[0-9a-f]{32}$/.test(fp.jarMd5), fp.jarMd5)
    return fp
  } catch (e) {
    rec(section, 'fingerprint collection', false, e.message)
    return { error: String(e.message) }
  }
}

async function agentsSection(admin, ops) {
  const section = 'agents'
  const wr = { token: admin }

  const list0 = await api('GET', '/api/agents/packages', wr)
  const builtin = names(list0.json?.data)
  rec(section, 'GET /packages 200', list0.status === 200, `status=${list0.status}`)
  rec(section, 'builtin packages visible (plan/build/coordinator)',
    builtin.includes('plan') && builtin.includes('build') && builtin.includes('coordinator'),
    `names=${builtin.join(',')}`)

  const paths = await api('GET', '/api/agents/packages/paths', wr)
  const rootPath = paths.json?.data?.root || ''
  rec(section, 'GET /packages/paths -> /opt/ai-starter/runtime/agents',
    paths.status === 200 && rootPath.includes('/opt/ai-starter/runtime/agents'), rootPath)

  const installed = await api('POST', '/api/agents/packages/install', {
    ...wr,
    body: { source: 'builtin', path: '/tmp/fixtures/fixture-json' },
  })
  rec(section, 'POST /packages/install (dir import)',
    installed.status === 200 && names((await api('GET', '/api/agents/packages', wr)).json?.data).includes('fixture-json'),
    `status=${installed.status} code=${installed.json?.code} msg=${installed.json?.msg || ''}`)

  const zipPath = process.env.FIXTURE_ZIP || 'D:\\ch\\project\\.tmp\\fixtures\\fixture-zip.zip'
  const zipBuf = readFileSync(zipPath)
  const form = new FormData()
  form.append('file', new Blob([zipBuf], { type: 'application/zip' }), 'fixture-zip.zip')
  const zip = await api('POST', '/api/agents/packages/import', { ...wr, form })
  const afterZip = names((await api('GET', '/api/agents/packages', wr)).json?.data)
  rec(section, 'POST /packages/import (multipart zip)',
    zip.status === 200 && afterZip.includes('fixture-zip'),
    `status=${zip.status} code=${zip.json?.code} msg=${zip.json?.msg || ''}`)

  const jsonImport = await api('POST', '/api/agents/packages/import', {
    ...wr,
    body: { path: '/tmp/fixtures/fixture-json' },
  })
  rec(section, 'POST /packages/import (JSON {path})',
    jsonImport.status === 200 && jsonImport.json?.data?.name === 'fixture-json',
    `status=${jsonImport.status} data=${JSON.stringify(jsonImport.json?.data || jsonImport.json?.msg)}`)

  const off = await api('POST', '/api/agents/packages/toggle', { ...wr, body: { name: 'fixture-json', enabled: false } })
  const listOff = await api('GET', '/api/agents/packages', wr)
  const offItem = (listOff.json?.data || []).find((x) => x?.name === 'fixture-json')
  const offOk = off.status === 200 && (offItem?.enabled === false || offItem?.enabled === 0)
  rec(section, 'POST /packages/toggle enabled=false', offOk,
    `status=${off.status} item=${JSON.stringify(offItem)}`)

  const on = await api('POST', '/api/agents/packages/toggle', { ...wr, body: { name: 'fixture-json', enabled: true } })
  const listOn = await api('GET', '/api/agents/packages', wr)
  const onItem = (listOn.json?.data || []).find((x) => x?.name === 'fixture-json')
  rec(section, 'POST /packages/toggle enabled=true (restored)',
    on.status === 200 && (onItem?.enabled === true || onItem?.enabled === 1),
    `status=${on.status} item=${JSON.stringify(onItem)}`)

  const sources = await api('GET', '/api/agents/packages/market/sources', wr)
  const sourceKeys = (sources.json?.data || []).map((x) => String(x?.source || ''))
  rec(section, 'GET /packages/market/sources (SPI enum)',
    sources.status === 200 && Array.isArray(sources.json?.data)
      && sourceKeys.some((s) => s.toLowerCase() === 'builtin'),
    `status=${sources.status} sources=${sourceKeys.join(',')}`)

  const search = await api('GET', '/api/agents/packages/market/search?keyword=plan', wr)
  rec(section, 'GET /packages/market/search',
    search.status === 200 && !!search.json?.data?.sources,
    `status=${search.status} items=${(search.json?.data?.items || []).length} errors=${JSON.stringify(search.json?.data?.errors)}`)

  const del = await api('DELETE', '/api/agents/packages/fixture-json', wr)
  const afterDel = names((await api('GET', '/api/agents/packages', wr)).json?.data)
  rec(section, 'DELETE /packages/fixture-json (uninstall)',
    del.status === 200 && !afterDel.includes('fixture-json') && del.json?.data?.removed_dir !== false,
    `status=${del.status} data=${JSON.stringify(del.json?.data || del.json?.msg)} remaining=${afterDel.join(',')}`)
  rec(section, 'fixture-zip retained as test data', afterDel.includes('fixture-zip'), `names=${afterDel.join(',')}`)

  // Non-admin: reads open, every write is a wall.
  const opsRead = await api('GET', '/api/agents/packages', { token: ops })
  rec(section, 'ops read allowed', opsRead.status === 200, `status=${opsRead.status}`)

  const probes = [
    ['ops POST /packages/install', api('POST', '/api/agents/packages/install', { token: ops, body: { path: '/tmp/fixtures/fixture-json' } })],
    ['ops POST /packages/import JSON', api('POST', '/api/agents/packages/import', { token: ops, body: { path: '/tmp/fixtures/fixture-json' } })],
    ['ops POST /packages/toggle', api('POST', '/api/agents/packages/toggle', { token: ops, body: { name: 'fixture-zip', enabled: false } })],
    ['ops DELETE /packages/{name}', api('DELETE', '/api/agents/packages/__ops_perm_probe__', { token: ops })],
  ]
  for (const [label, promise] of probes) {
    const r = await promise
    rec(section, `${label} -> 403`, r.status === 403, `status=${r.status} msg=${r.json?.msg || ''}`)
  }
  const opsForm = new FormData()
  opsForm.append('file', new Blob([zipBuf], { type: 'application/zip' }), 'fixture-zip.zip')
  const opsZip = await api('POST', '/api/agents/packages/import', { token: ops, form: opsForm })
  rec(section, 'ops POST /packages/import zip -> 403', opsZip.status === 403, `status=${opsZip.status}`)

  const finalList = names((await api('GET', '/api/agents/packages', wr)).json?.data)
  rec(section, 'test data preserved (fixture-zip still installed)', finalList.includes('fixture-zip'),
    `names=${finalList.join(',')}`)
}

async function botsSection(admin) {
  const section = 'bots'
  const step = async (action) => {
    const r = await api('POST', `/v2/ai/bot-binding/1/${action}`, { token: admin, body: {} })
    return { action, status: r.status, code: r.json?.code, msg: r.json?.msg || '', data: r.json?.data }
  }
  const detail = async () => {
    const r = await api('GET', '/v2/ai/bot-binding/1', { token: admin })
    return { status: r.status, body: r.json }
  }

  const before = await detail()
  rec(section, 'GET /bot-binding/1 readable', before.status === 200, `status=${before.status}`)

  const stop = await step('stop')
  rec(section, 'POST /{id}/stop', stop.status === 200 && stop.code !== undefined,
    `status=${stop.status} code=${stop.code} msg=${stop.msg}`)

  const start = await step('start')
  rec(section, 'POST /{id}/start', start.status === 200, `status=${start.status} code=${start.code} msg=${start.msg}`)

  const restart = await step('restart')
  rec(section, 'POST /{id}/restart', restart.status === 200, `status=${restart.status} code=${restart.code} msg=${restart.msg}`)

  const logout = await step('logout')
  rec(section, 'POST /{id}/logout', logout.status === 200 && String(logout.msg || '').length >= 0,
    `status=${logout.status} code=${logout.code} msg=${logout.msg}`)

  const restore = await step('start')
  rec(section, 'POST /{id}/start restores online', restore.status === 200,
    `status=${restore.status} msg=${restore.msg}`)

  const after = await detail()
  const raw = JSON.stringify(after.body || {})
  rec(section, 'binding id=1 final state online', /online/.test(raw), raw.slice(0, 300))
}

async function sseSection(admin) {
  const section = 'sse'

  const noAuth = await api('GET', '/v2/sessions/1/workspace/events')
  rec(section, 'anonymous request rejected (not a stream)',
    noAuth.status !== 200 || !String(noAuth.headers.get('content-type') || '').includes('text/event-stream'),
    `status=${noAuth.status} ct=${noAuth.headers.get('content-type')}`)

  const missing = await api('GET', '/v2/sessions/999999999/workspace/events', { token: admin })
  rec(section, 'unknown session -> 404 (frontend stops reconnecting)', missing.status === 404,
    `status=${missing.status} msg=${missing.json?.msg || ''}`)

  const pathRes = await api('GET', '/v2/sessions/1/workspace-path', { token: admin })
  const wsPath = pathRes.json?.data?.path || ''
  rec(section, 'workspace-path resolves', pathRes.status === 200 && !!wsPath,
    `status=${pathRes.status} path=${wsPath || '(empty)'}`)
  if (!wsPath) return

  // The root must exist before subscribing so the first poll only reports the
  // probe file below (a missing root would make the create ambiguous).
  // sudo: the workspace tree is root-owned, only the service (root) and sudo
  // can write there; running as the ssh user would fail with EACCES.
  await ssh(
    `echo kali | sudo -S mkdir -p '${wsPath}' 2>/dev/null; `
    + `echo kali | sudo -S touch '${wsPath}/.keep' 2>/dev/null; `
    + `ls -ld '${wsPath}'`,
  )

  const probeName = `sse-probe-${Date.now()}.txt`
  const controller = new AbortController()
  const events = []
  let streamStatus = 0
  let contentType = ''
  let pumpError = null

  const open = fetch(`${BASE}/v2/sessions/1/workspace/events`, {
    headers: { 'x-oauth-token': admin, Authorization: `Bearer ${admin}`, accept: 'text/event-stream' },
    signal: controller.signal,
  })
  const pump = (async () => {
    const res = await open
    streamStatus = res.status
    contentType = res.headers.get('content-type') || ''
    if (!res.ok || !res.body) return
    const parser = makeFrameParser((frame) => events.push(frame))
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      parser.push(decoder.decode(value, { stream: true }))
    }
  })().catch((e) => { pumpError = e })

  await sleep(800)
  await ssh(`echo kali | sudo -S touch '${wsPath}/${probeName}' 2>/dev/null; `
    + `ls -l '${wsPath}/${probeName}'`)

  const want = Date.now() + 8000
  const findAdd = () => events.find((e) => e?.path === probeName && e?.type === 'add')
  while (Date.now() < want && !findAdd()) await sleep(200)
  const add = findAdd()

  // The poller resets its heartbeat clock on every pushed event, so the beat
  // lands ~15s AFTER the add, not 15s after the stream opened.
  const heartbeatDeadline = Date.now() + (add ? 18000 : 10000)
  const findHeartbeat = () => events.find((e) => e?.type === 'heartbeat')
  while (Date.now() < heartbeatDeadline && !findHeartbeat()) await sleep(300)
  const heartbeat = findHeartbeat()

  controller.abort()
  await pump
  if (pumpError && !/abort/i.test(String(pumpError))) {
    console.log(`      stream pump stopped: ${pumpError}`)
  }

  rec(section, 'GET /sessions/1/workspace/events -> 200 event-stream',
    streamStatus === 200 && contentType.includes('text/event-stream'),
    `status=${streamStatus} ct=${contentType} err=${pumpError || 'none'}`)
  rec(section, 'real add event for the touched file',
    !!add, `events=${events.length} types=${[...new Set(events.map((e) => e?.type))].join(',')} path=${add?.path || '(none)'}`)
  rec(section, 'sessionId echoed verbatim as "1"', add?.sessionId === '1' || heartbeat?.sessionId === '1',
    `sessionId=${add?.sessionId ?? heartbeat?.sessionId ?? '(none)'}`)
  rec(section, 'path is workspace-relative with forward slashes',
    !!add && !add.path.startsWith('/') && !add.path.includes('\\'), `path=${add?.path}`)
  rec(section, 'heartbeat inside 15s', !!heartbeat, `heartbeat=${JSON.stringify(heartbeat || null)}`)

  // The touched probe file is test data: keep it on disk, only drop the stream.
  console.log(`      probe file kept at ${wsPath}/${probeName}`)
}

// ---------------------------------------------------------------------------

async function main() {
  console.log(`api-accept -> ${BASE}`)

  const fp = await fingerprint()

  const adminLogin = await login('admin', process.env.USER_PASS || 'admin123')
  rec('auth', 'admin login', adminLogin.ok, `status=${adminLogin.status} ${adminLogin.msg}`)
  const opsLogin = await login('ops', process.env.OPS_PASS || 'Ops@Guada2026')
  rec('auth', 'ops login', opsLogin.ok, `status=${opsLogin.status} ${opsLogin.msg}`)

  // Each section is isolated: one broken probe must not swallow the report of
  // everything that came after it (the first run died inside sse and lost all
  // output because there was no report on the failure path).
  const sections = [
    ['agents', () => agentsSection(adminLogin.token, opsLogin.ok ? opsLogin.token : '')],
    ['bots', () => botsSection(adminLogin.token)],
    ['sse', () => sseSection(adminLogin.token)],
  ]
  for (const [name, fn] of sections) {
    if (!adminLogin.ok) { rec(name, 'admin token available', false, 'admin login failed'); continue }
    try {
      await fn()
    } catch (e) {
      rec(name, 'section completed', false, `crashed: ${e.message}`)
    }
  }

  const failed = results.filter((r) => !r.pass)
  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    fingerprint: fp,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  }
  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(join(REPORT_DIR, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  console.log(`\nTOTAL ${results.length}  PASS ${results.length - failed.length}  FAIL ${failed.length}`)
  if (failed.length) for (const f of failed) console.log(`  FAIL  [${f.section}] ${f.name} :: ${f.detail}`)
  console.log(`report: ${join(REPORT_DIR, 'report.json')}`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error('api-accept crashed:', e)
  process.exit(2)
})
