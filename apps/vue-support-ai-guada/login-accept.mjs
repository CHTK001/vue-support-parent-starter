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

// 会话是否真能用：取令牌做一次受保护调用
// 令牌的存储键由框架决定，不要猜格式或长度阈值：把所有键值列出来找最长的那条。
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
let tokenValue = tok ? await page.evaluate((k) => localStorage.getItem(k), tok.k) : null
// 存的是 JSON 字符串（带引号）时要去掉引号再放进 Bearer 头，否则服务端拿到的是 "eyJ…"
// 而不是 eyJ…，直接 403 —— 这是取样问题，不是会话失效。
if (tokenValue && tokenValue.startsWith('"')) {
  try {
    tokenValue = JSON.parse(tokenValue)
  } catch {}
  console.log('  (存储值是 JSON 字符串，已解引号)')
}
chk('a token was stored', !!tokenValue, tok ? `${tok.k} len=${String(tokenValue).length}` : 'none')
if (tokenValue) {
  const r = await fetch(`${API}/v2/ai/generate/tasks?type=image&limit=1&offset=0`, {
    headers: { Authorization: `Bearer ${tokenValue}` },
  })
  chk('the session works for an authenticated call', r.status === 200, `HTTP ${r.status}`)
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
