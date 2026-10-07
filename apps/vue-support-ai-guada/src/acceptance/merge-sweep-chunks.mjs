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
//   node src/acceptance/merge-sweep-chunks.mjs --dir <d> --out <f>   # 分块目录/输出可覆盖
//     默认仍读仓库内 src/acceptance/.ui-click-sweep-chunks、写 .ui-click-sweep/report.json；
//     run-sweep-chunks.ps1 把块落在 .local-run/sweep-chunks（那里装的是本会话 base=15690
//     的块，而仓库目录里是 21 个 base=15689 的旧块，混用会张冠李戴），故用这两个参数指路。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '..', '..')
const argOf = (name, dflt) => {
  const i = process.argv.indexOf(name)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt
}
const CHUNK_DIR = path.resolve(argOf('--dir', path.join(APP, 'src', 'acceptance', '.ui-click-sweep-chunks')))
const OUT = path.resolve(argOf('--out', path.join(APP, '.ui-click-sweep', 'report.json')))

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
// 与单次全量跑的 summary 对齐：§3.2 要用 total / byState / 空路由 / 无名元素，
// 只给 pass/fail/warn 会让合并报告比一次跑完的报告少一截，反而没法互相印证。
const byState = {}
let noNameCount = 0
const clickError = []
const notClickable = []
const noEffect = []
const needsForce = []
const vanished = []
const stateDependent = []
const buckets = { clickError, notClickable, noEffect, needsForce, vanished, stateDependent }

for (const rt of routes) {
  for (const e of rt.elements || []) {
    byState[e.state] = (byState[e.state] || 0) + 1
    if (e.noName) noNameCount++
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

/**
 * HTTP 层异常台账。
 *
 * 元素上本来就带 `err4xx`/`err5xx`，但**汇总里看不见** —— 报告只报 PASS/FAIL/WARN，
 * 于是「点了、后端回了 4xx、但产品自己没抛错」这类样本会静悄悄算成 PASS。
 * 这里把它们按「状态码 + 端点 + 路由」汇总出来，只做**显式化**：
 *   * 不改 FAIL/WARN 判据（判据只能加强不能放松，改分类属于放宽/收紧的实质变更，
 *     必须先有敏感性对照再动，不能顺手改）；
 *   * 每一类的定性（哪些是正确的业务响应、哪些是真缺陷）写在 SIGNOFF 里逐条给证据。
 * 分割要同时吃「空格分隔」和「逗号分隔」两种形态：实测同一元素的多个 4xx 是
 * `404 /a.png,404 /b.svg` 拼在一起的，只按空格切会把它们粘成一条。
 */
const httpErrors = {}
let httpErrorElements = 0
for (const rt of routes) {
  for (const e of (rt.elements || [])) {
    const raw = [e.err4xx, e.err5xx].filter(Boolean).join(',')
    if (!raw) continue
    httpErrorElements++
    for (const part of String(raw).split(/(?=\d{3}\s)/).map((s) => s.trim().replace(/,$/, '')).filter(Boolean)) {
      const key = part + '  @' + rt.route
      httpErrors[key] = (httpErrors[key] || 0) + 1
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
  summary: {
    total: Object.values(byState).reduce((a, b) => a + b, 0),
    byState,
    pass, fail: fail + routes.filter((r) => r.total === 0).length, warn,
    emptyRoutes: routes.filter((r) => r.total === 0).map((r) => ({ name: r.name, notes: r.notes })),
    skippedRoutes: [],
    // noName：无 accessible name 但**已照常点击**的元素（a11y 观察，不影响 FAIL）
    noAccessibleName: routes.flatMap((r) => (r.elements || []).filter((e) => e.noName)),
    noAccessibleNameCount: noNameCount,
    // HTTP 层台账：不影响上面的 pass/fail/warn，仅显式化，逐类定性见 SIGNOFF
    httpErrorElements,
    httpErrors,
    ...Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
  },
}

console.log('')
console.log('  merged routes=' + routes.length + ' from ' + files.length + ' chunks')
console.log('  total=' + merged.summary.total + '  PASS=' + pass + ' FAIL=' + merged.summary.fail + ' WARN=' + warn)
console.log('  byState=' + JSON.stringify(byState))
console.log('  空采集路由=' + merged.summary.emptyRoutes.length + '  可点但无 accessible name(已点击)=' + noNameCount)
console.log('  携带 HTTP 4xx/5xx 的元素=' + httpErrorElements + ' 条（不影响 PASS/FAIL，逐类定性见 SIGNOFF）')
for (const [k, v] of Object.entries(httpErrors).sort((a, b) => b[1] - a[1])) {
  console.log('    ' + String(v).padStart(3) + ' x ' + k)
}
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
