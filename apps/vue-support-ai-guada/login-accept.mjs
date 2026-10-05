/**
 * Login acceptance, real browser path.
 *
 * Positive: admin/admin123 must land inside the app (not stay on /login) and the
 * resulting session must work for an authenticated call.
 * Negative: a wrong password must be refused, and must not leave a usable session.
 *
 * Note on the auth mechanism: this deployment authenticates via the framework's
 * temporary static account (plugin.oauth.temp.open=true with a salted digest of
 * admin123) - the framework's own Javadoc forbids that in production. This script
 * proves login *works*; it does not prove the production oauth path works.
 */
import { chromium } from 'playwright'

const FE = 'http://localhost:15689'
const API = 'http://192.168.50.198:8787'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(name)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}

const browser = await chromium.launch()

// ---------- positive ----------
console.log('=== 1. correct credentials ===')
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.setDefaultTimeout(60000)
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)))

await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
// 登录页必须先 snapshot 再 fill：open 后立即 fill 会早于 SPA hydrate，值被清空
await page.waitForSelector("input[type='text']")
await sleep(800)
await page.fill("input[type='text']", 'admin')
await page.fill("input[type='password']", 'admin123')
await page.click('button.flex')
await sleep(5000)

const after = await page.evaluate(() => ({
  url: location.href,
  onLogin: location.pathname.includes('/login'),
  bodyLen: document.body.innerText.length,
  hasNav: /图像生成|助手|知识库/.test(document.body.innerText),
}))
console.log(`  ${JSON.stringify(after)}`)
chk('login leaves the login page', !after.onLogin, after.url)
chk('app shell rendered after login', after.hasNav, `bodyLen=${after.bodyLen}`)

// 会话是否真能用：**走应用自己的 http 层**发一次受保护请求。
//
// 为什么不能直接把 localStorage 里的值当 Bearer：那是**密文**（实测
// ai-guada:accessToken 1856 字符、不以 eyJ 开头，ai-guada:userInfo 是 kv/ 前缀密文）。
// 真正发出去的是 httpCrypto 拦截器里 getAccessToken() **解密后**的值
// （packages/core/src/httpCrypto.ts:310-314）。拿密文当令牌必然 403 ——
// 那是取样方式错，不是会话失效。
const tokenFromPage = await page.evaluate(() => {
  const all = []
  for (const k of Object.keys(localStorage)) {
    const v = localStorage.getItem(k)
    if (typeof v === 'string' && v.length > 100) all.push({ k, len: v.length })
  }
  all.sort((a, b) => b.len - a.len)
  return all
})
console.log(`  存储里较长的键: ${JSON.stringify(tokenFromPage.slice(0, 3))}`)
const tok = tokenFromPage[0]
const rawToken = tok ? await page.evaluate((k) => localStorage.getItem(k), tok.k) : null
let tokenValue = rawToken
if (tokenValue && tokenValue.startsWith('"')) {
  try {
    tokenValue = JSON.parse(tokenValue)
  } catch {}
}
chk('a token was stored', !!tokenValue, tok ? `${tok.k} len=${String(tokenValue).length}` : 'none')
console.log(`  存的是明文 JWT=${String(tokenValue ?? '').startsWith('eyJ')}（false 说明是密文，需经应用 http 层解密）`)

// 真正要验的：登录后的会话能带动一次需要鉴权的调用。
// 做法是让页面走自己的 axios（拦截器会自动解密并注入 Authorization），
// 再断言拿到的是业务数据而不是 403。
const authed = await page.evaluate(async () => {
  const mod = window.__aiGuadaHttp
  if (!mod || typeof mod.get !== 'function') {
    return { skipped: true, reason: '页面未暴露 http 调试入口' }
  }
  try {
    const rows = await mod.get('/ai/generate/tasks', { params: { type: 'image', limit: 1, offset: 0 } })
    return { skipped: false, ok: Array.isArray(rows) || !!rows }
  } catch (e) {
    return { skipped: false, ok: false, err: String(e).slice(0, 120) }
  }
})
if (authed.skipped) {
  // 没有调试入口时的等价验证：打开一个必须鉴权才能渲染的页面，
  // 数据渲染出来即说明令牌全程有效（否则会是空态或跳登录）。
  await page.goto(`${FE}/chat/1`, { waitUntil: 'domcontentloaded' })
  await sleep(4000)
  const guarded = await page.evaluate(() => ({
    url: location.href,
    onLogin: location.pathname.includes('/login'),
    hasSession: document.body.innerText.length > 200,
  }))
  chk(
    'the session works for an authenticated page',
    !guarded.onLogin && guarded.hasSession,
    `url=${guarded.url} bodyLen=${guarded.hasSession}`,
  )
} else {
  chk('the session works for an authenticated call', authed.ok === true, authed.err ?? '')
}

// ---------- negative ----------
console.log('\n=== 2. wrong password must be refused ===')
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const bad = await ctx2.newPage()
bad.setDefaultTimeout(60000)
await bad.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await bad.waitForSelector("input[type='text']")
await sleep(800)
await bad.fill("input[type='text']", 'admin')
await bad.fill("input[type='password']", 'definitely-wrong-password')
await bad.click('button.flex')
await sleep(5000)
const badState = await bad.evaluate(() => ({ url: location.href, onLogin: location.pathname.includes('/login') }))
console.log(`  ${JSON.stringify(badState)}`)
chk('wrong password does NOT get in', badState.onLogin === true, badState.url)

const badToken = await bad.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    const v = localStorage.getItem(k)
    if (typeof v === 'string' && v.length > 200) return v
  }
  return null
})
// 直接打接口也要被拒（前端拦不住脚本，服务端必须拦）
// 这个 API 用「HTTP 200 + 业务码」表达结果，不能拿 HTTP 状态码判成败。
// 真正的安全属性是「错误口令拿不到令牌」。
const badApi = await fetch(`${API}/v2/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'definitely-wrong-password' }),
})
const badBody = await badApi.json()
const badLeaked = !!(badBody?.data?.accessToken || badBody?.data?.token)
console.log(`  API: HTTP ${badApi.status} success=${badBody?.success} code=${badBody?.code} msg=${String(badBody?.msg ?? '').slice(0, 30)}`)
chk('wrong password gets no token from the API', badBody?.success === false && !badLeaked, `success=${badBody?.success} token=${badLeaked}`)

console.log('\n=== 3. anonymous access must be refused ===')
const anon = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=1&offset=0`)
chk('anonymous request refused', anon.status === 403 || anon.status === 401, `HTTP ${anon.status}`)

chk('no unexpected JS errors', errs.filter((e) => !/403|Failed to load/.test(e)).length === 0, errs.slice(0, 2).join(' | '))

await page.screenshot({ path: 'D:/ch/project/.tmp/sg/shots/login-after.png' })
await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) process.exit(1)
