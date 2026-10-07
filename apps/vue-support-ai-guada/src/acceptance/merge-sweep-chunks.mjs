#!/usr/bin/env node
// Merge chunked ui-click-sweep reports into one full report.
//
// WHY (2026-10-06): the workspace is shared and something else killed the
// Playwright browser twice mid-run, which invalidated two full 25-route sweeps.
// A single full run therefore has a high chance of being wasted. The sweep takes
// a substring filter as argv[2] and always overwrites report.json, so the run is
// split into chunks: each chunk's report is copied aside and only the chunk that
// died is re-run. This script concatenates the per-chunk routes and recomputes
// the same PASS/FAIL/WARN classification the sweep prints, so the merged numbers
// are identical to what a single uninterrupted run would have produced.
//
// Usage:
//   node src/acceptance/merge-sweep-chunks.mjs            # merge + print summary
//   node src/acceptance/merge-sweep-chunks.mjs --write    # also write report.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '..', '..')
const CHUNK_DIR = path.join(APP, 'src', 'acceptance', '.ui-click-sweep-chunks')
const OUT = path.join(APP, '.ui-click-sweep', 'report.json')

const FAIL_STATES = new Set(['click-error', 'not-clickable'])
const WARN_STATES = new Set(['no-effect', 'needs-force', 'vanished', 'state-dependent'])

if (!fs.existsSync(CHUNK_DIR)) {
  console.error('no chunk dir: ' + CHUNK_DIR)
  process.exit(2)
}

// 只认分块报告（cNN-*.json），跳过半截的 partial 与目录里别的检查产物
const files = fs.readdirSync(CHUNK_DIR)
  .filter((f) => /^c\d+.*\.json$/.test(f) && !f.includes('.partial'))
  .sort()
if (!files.length) {
  console.error('no chunk reports in ' + CHUNK_DIR)
  process.exit(2)
}

const byRoute = new Map()
let base = ''
let startedAt = ''
let discovered = {}
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(CHUNK_DIR, f), 'utf8'))
  base = r.base || base
  startedAt = r.startedAt || startedAt
  discovered = r.discovered || discovered
  for (const rt of r.routes || []) {
    byRoute.set(rt.route, rt)
  }
  console.log('  chunk ' + f + ' -> routes=' + (r.routes || []).length)
}

const routes = [...byRoute.values()]
let pass = 0
let fail = 0
let warn = 0
const clickError = []
const notClickable = []
const noEffect = []
const needsForce = []
const vanished = []
const stateDependent = []
const buckets = { clickError, notClickable, noEffect, needsForce, vanished, stateDependent }

for (const rt of routes) {
  for (const e of rt.elements || []) {
    if (FAIL_STATES.has(e.state)) {
      fail++
      if (e.state === 'click-error') clickError.push({ ...e, route: rt.route })
      else notClickable.push({ ...e, route: rt.route })
    } else if (WARN_STATES.has(e.state)) {
      warn++
      if (e.state === 'no-effect') noEffect.push({ ...e, route: rt.route })
      else if (e.state === 'needs-force') needsForce.push({ ...e, route: rt.route })
      else if (e.state === 'vanished') vanished.push({ ...e, route: rt.route })
      else stateDependent.push({ ...e, route: rt.route })
    } else {
      pass++
    }
  }
}

const merged = {
  base,
  startedAt,
  mergedAt: new Date().toISOString(),
  mergedFrom: files,
  discovered,
  routes,
  summary: { pass, fail, warn, ...Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])) },
}

console.log('')
console.log('  merged routes=' + routes.length + ' from ' + files.length + ' chunks')
console.log('  PASS=' + pass + ' FAIL=' + fail + ' WARN=' + warn)
console.log('  ' + JSON.stringify(merged.summary))
if (clickError.length) {
  console.log('  --- FAIL click-error ---')
  for (const e of clickError) console.log('  [' + e.route + '] ' + e.name + '  ' + String(e.detail || '').slice(0, 120))
}
if (notClickable.length) {
  console.log('  --- FAIL not-clickable ---')
  for (const e of notClickable) console.log('  [' + e.route + '] ' + e.name + '  ' + String(e.detail || '').slice(0, 120))
}
if (noEffect.length) {
  console.log('  --- WARN no-effect ---')
  for (const e of noEffect) console.log('  [' + e.route + '] ' + e.name)
}
for (const k of Object.keys(buckets)) {
  merged.summary[k + 'List'] = buckets[k]
}

if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  // 护栏：分块目录可能被共享工作区的清理删过，只剩个别块时合并结果会比现有
  // 报告更小；直接覆盖等于拿局部数据冒充全量。要么补齐分块，要么显式 --force。
  if (fs.existsSync(OUT) && !process.argv.includes('--force')) {
    let prevRoutes = 0
    try { prevRoutes = (JSON.parse(fs.readFileSync(OUT, 'utf8')).routes || []).length } catch { /* 坏文件按 0 处理 */ }
    if (prevRoutes > routes.length) {
      console.error('  REFUSED: ' + OUT + ' has ' + prevRoutes + ' routes, merge has only ' + routes.length)
      console.error('  run again with --force to overwrite on purpose')
      process.exit(3)
    }
    if (prevRoutes) fs.copyFileSync(OUT, OUT + '.prev.json')
  }
  fs.writeFileSync(OUT, JSON.stringify(merged, null, 2))
  console.log('  written: ' + OUT)
}
