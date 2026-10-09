// 在【生产构建产物】上跑全部浏览器验收（不经 vite dev）
// 与 run-browser-accept.ps1 的区别：不做 /src/* 预热（那是 dev 专有），
// base 由 AI_ACCEPT_BASE 指定，跑的是 dist 静态服务。
const BASE = process.env.AI_ACCEPT_BASE || 'http://localhost:15690'
const SUITES = [
  'acc-prodgrade-frontend.mjs','acc-search-ux.mjs','acc-search-render.mjs',
  'acc-image-lib-ui.mjs','acc-image-lib-foot.mjs','acc-image-library-tab.mjs',
  'acc-image-lib-rename.mjs','acc-video-duration.mjs','acc-salted-login.mjs',
  'acc-library-menu.mjs','acc-face-edit.mjs',
]

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)

// image-lib-ui / image-library-tab / salted-login 三个套件**刻意**不写死口令，
// 强制从环境变量 AI_ACCEPT_PASS 读取（salted-login 注释明言「拒绝把明文口令
// 写进脚本」）；未设置时它们直接 exit(2) 且不打印 RESULT —— round4/5/6 曾因此
// 静默丢掉 67 项覆盖而无人察觉。这里提前预警，结尾再把「无 RESULT」计为硬失败。
if (!process.env.AI_ACCEPT_PASS) {
  console.log('[warn] 未设置 AI_ACCEPT_PASS —— 以下套件将无结果:')
  console.log('       acc-image-lib-ui / acc-image-library-tab / acc-salted-login')
  console.log("       用法: 先 $env:AI_ACCEPT_PASS='xxx' 再运行本 runner（口令不入库）")
}

let totalPass = 0, totalAll = 0
const failed = []
console.log(`目标: ${BASE}`)
for (const s of SUITES) {
  let out = ''
  try {
    const r = await run('node', [s], { cwd: process.cwd(), env: { ...process.env, AI_ACCEPT_BASE: BASE }, maxBuffer: 32 * 1024 * 1024 })
    out = r.stdout + r.stderr
  } catch (e) {
    out = String(e.stdout || '') + String(e.stderr || '') + String(e.message || '')
  }
  const m = /RESULT (\d+)\/(\d+) PASSED/.exec(out)
  if (m) {
    totalPass += Number(m[1]); totalAll += Number(m[2])
    console.log(`--- ${s} ---\n      ${m[0]}`)
  } else {
    console.log(`--- ${s} ---\n      无 RESULT`)
    failed.push(s)
  }
  const fails = [...out.matchAll(/\[FAIL\][^\r\n]*/g)].slice(0, 4)
  fails.forEach((f) => console.log('        ' + f[0].trim()))
}
console.log('')
console.log(`  【产物】浏览器合计: ${totalPass} / ${totalAll} PASSED`)
if (failed.length) console.log('  未产生结果: ' + failed.join(', '))
// 有套件无 RESULT（含 AI_ACCEPT_PASS 未设导致的静默退出）或检查项失败 → 非零退出，
// 让流水线/验收脚本能按退出码判定，而不是只靠人眼扫合计
if (failed.length || totalPass < totalAll) process.exitCode = 1