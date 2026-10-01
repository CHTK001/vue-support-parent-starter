/**
 * Focused acceptance: hover a model in the selector -> info card appears.
 *
 * Chain (from source):
 *   ChatInput .model-selector-btn click   -> openModelPanel
 *   ModelSelectorPanel .model-item        -> onItemEnter(model) -> hoverModel
 *   ModelInfoCard (CustomPopover)         -> .mic sections
 *
 * The Chinese section titles are written as \uXXXX escapes so this file stays
 * pure ASCII: the expected UI text is Chinese, but the script itself is not.
 *
 * ASCII only by design.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const SHOT = 'D:/ch/project/.tmp/sg/shots'
fs.mkdirSync(SHOT, { recursive: true })
const FE = 'http://localhost:15689'

// expected UI text
const T = {
  ability: '\u80fd\u529b',        // neng li
  modality: '\u6a21\u6001',       // mo tai
  cost: '\u6210\u672c',           // cheng ben
  wan: '100\u4e07',               // 100 wan
  limit: '\u9650\u5236',          // xian zhi
  meta: '\u5143\u6570\u636e',     // yuan shu ju
  knowledge: '\u77e5\u8bc6',      // zhi shi
  released: '\u53d1\u5e03\u65f6\u95f4', // fa bu shi jian
  dash: '\u2014',                 // em dash placeholder
}

const pass = []
const fail = []
const chk = (name, ok, extra = '') => {
  ;(ok ? pass : fail).push(name)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Wait until the backend answers before driving the UI: a concurrent session
 * keeps redeploying it, and a suite that starts during a restart just dies at
 * the first page load with a misleading "NO SUMMARY".
 */
const waitBackend = async (timeoutMs = 300000) => {
  const t0 = Date.now()
  for (;;) {
    try {
      const r = await fetch('http://192.168.50.198:8787/v2/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      })
      if (r.status === 200 && (await r.json())?.data?.accessToken) {
        console.log(`  backend ready after ${Math.round((Date.now() - t0) / 1000)}s`)
        return
      }
    } catch {
      /* not up yet */
    }
    if (Date.now() - t0 > timeoutMs) {
      throw new Error('backend did not become ready within the timeout')
    }
    await sleep(5000)
  }
}
await waitBackend()

const browser = await chromium.launch()
const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.setDefaultTimeout(60000)
const jsErrs = []
page.on('pageerror', (e) => jsErrs.push(String(e).slice(0, 140)))
page.on('response', async (r) => {
  if (/login/i.test(r.url())) {
    let b = ''
    try {
      b = (await r.text()).slice(0, 200)
    } catch {}
    console.log(`  NET ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}  ${b.replace(/\n/g, ' ')}`)
  }
})

console.log('=== login ===')
await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector("input[type='text']")
await sleep(2500)
// Retry the login: a redeploy can make /v2/user/login return 500 for a moment,
// and a one-shot attempt turns that transient into a fatal "no token" abort.
let gotToken = false
for (let attempt = 1; attempt <= 6 && !gotToken; attempt++) {
  await page.fill("input[type='text']", 'admin')
  await page.fill("input[type='password']", 'admin123')
  await page.click('button.flex')
  gotToken = await page
    .waitForFunction(() => Object.keys(localStorage).some((k) => /accessToken/i.test(k)), null, { timeout: 20000 })
    .then(() => true)
    .catch(() => false)
  console.log(`  login attempt ${attempt}: token=${gotToken}`)
  if (!gotToken) {
    await page.goto(`${FE}/login`, { waitUntil: 'domcontentloaded' })
    await sleep(3000)
  }
}
chk('logged in', gotToken)
if (!gotToken) {
  await page.screenshot({ path: `${SHOT}/model-hover-login-failed.png` })
  await browser.close()
  console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
  console.log('  ABORT: could not log in (backend redeploying)')
  process.exit(2)
}
await sleep(1500)

console.log('=== open chat page ===')
await page.goto(`${FE}/chat/new-session`, { waitUntil: 'domcontentloaded' })
await sleep(5000)
const onChat = await page.evaluate(() => ({ url: location.href, hasBtn: !!document.querySelector('.model-selector-btn') }))
console.log(`  ${JSON.stringify(onChat)}`)
chk('chat page loaded with a model button', onChat.hasBtn)

console.log('=== open the model selector ===')
await page.click('.model-selector-btn')
await sleep(1500)
const panel = await page.evaluate(() => ({
  items: document.querySelectorAll('.model-item').length,
  current: document.querySelectorAll('.current-model-item').length,
}))
console.log(`  model-item=${panel.items}  current-model-item=${panel.current}`)
chk('selector lists models to hover', panel.items > 0, `${panel.items} items`)

console.log('=== hover each model; the ability section is conditional ===')
const itemCount = await page.locator('.model-item').count()
const seen = []
let featureCard = null
let featureIndex = -1
for (let i = 0; i < itemCount; i++) {
  await page.locator('.model-item').nth(i).hover()
  await sleep(900)
  const info = await page.evaluate(() => {
    const el = document.querySelector('.mic')
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    return {
      found: true,
      name: el.querySelector('.mic-name')?.innerText?.trim() ?? '',
      provider: el.querySelector('.mic-provider')?.innerText?.trim() ?? '',
      sections: [...el.querySelectorAll('.mic-sec-title')].map((x) => x.innerText.trim()),
      rows: [...el.querySelectorAll('.mic-row')].map((x) => x.innerText.replace(/\n+/g, '=').trim()),
      w: Math.round(r.width),
      h: Math.round(r.height),
      visible: r.width > 0 && r.height > 0 && r.top >= 0,
      feats: el.querySelectorAll('.mic-feat').length,
      kinds: el.querySelectorAll('.mic-kind').length,
    }
  })
  if (!info.found) {
    seen.push({ name: '(no card)', feats: 0, hasAbility: false })
    continue
  }
  const hasAbility = info.sections.includes(T.ability)
  seen.push({ name: info.name, feats: info.feats, hasAbility, sections: info.sections.length })
  console.log(`  [${i}] ${info.name}  feats=${info.feats} ability=${hasAbility} sections=${JSON.stringify(info.sections)}`)
  if (!featureCard && info.feats > 0) {
    featureCard = info
    featureIndex = i
  }
}
console.log(`  hovered ${itemCount} models`)

chk('a card appeared for every hovered model', seen.every((s) => s.name !== '(no card)'), JSON.stringify(seen.filter((s) => s.name === '(no card)').length + ' without card'))
// the real contract: the ability section is present exactly when the model has features
chk(
  'ability section present iff the model has features',
  seen.every((s) => s.hasAbility === s.feats > 0),
  JSON.stringify(seen.map((s) => `${s.name}:f${s.feats}/a${s.hasAbility}`)),
)
chk('at least one model exposes features (ability branch exercised)', !!featureCard, featureCard ? featureCard.name : 'none in this list')

if (featureCard) {
  console.log('=== hover the feature-bearing model again for the screenshot ===')
  await page.locator('.model-item').nth(featureIndex).hover()
  await sleep(1200)
  const fc = await page.evaluate(() => {
    const el = document.querySelector('.mic')
    const r = el.getBoundingClientRect()
    return {
      name: el.querySelector('.mic-name')?.innerText?.trim() ?? '',
      provider: el.querySelector('.mic-provider')?.innerText?.trim() ?? '',
      sections: [...el.querySelectorAll('.mic-sec-title')].map((x) => x.innerText.trim()),
      rows: [...el.querySelectorAll('.mic-row')].map((x) => x.innerText.replace(/\n+/g, '=').trim()),
      w: Math.round(r.width),
      h: Math.round(r.height),
      visible: r.width > 0 && r.height > 0 && r.top >= 0,
      feats: el.querySelectorAll('.mic-feat').length,
      kinds: el.querySelectorAll('.mic-kind').length,
    }
  })
  console.log(`  name=${JSON.stringify(fc.name)} provider=${JSON.stringify(fc.provider)} box=${fc.w}x${fc.h}`)
  console.log(`  sections: ${JSON.stringify(fc.sections)}`)
  console.log(`  rows:     ${JSON.stringify(fc.rows)}`)
  const rowText = fc.rows.join(' | ')
  chk('card has a visible box', fc.visible === true, `${fc.w}x${fc.h}`)
  chk('header shows the model name', fc.name.length > 0, fc.name)
  chk('header shows the provider', fc.provider.length > 0, fc.provider)
  chk('section ability', fc.sections.includes(T.ability), JSON.stringify(fc.sections))
  chk('section modality', fc.sections.includes(T.modality), JSON.stringify(fc.sections))
  chk('section cost per 1M tokens', fc.sections.some((s) => s.includes(T.cost) && s.includes(T.wan)), JSON.stringify(fc.sections))
  chk('section limits', fc.sections.includes(T.limit), JSON.stringify(fc.sections))
  chk('section metadata', fc.sections.includes(T.meta), JSON.stringify(fc.sections))
  for (const k of ['Input', 'Output', 'Cache read', 'Cache write', 'Context', T.knowledge, T.released]) {
    chk(`row ${k}`, rowText.includes(k), rowText.slice(0, 50))
  }
  chk('feature icons rendered', fc.feats > 0, `${fc.feats}`)
  chk('modality icons rendered', fc.kinds > 0, `${fc.kinds}`)
  chk('missing values use the em-dash placeholder', rowText.includes(T.dash), rowText.slice(0, 50))
  await page.screenshot({ path: `${SHOT}/model-hover-card.png` })
}

console.log('=== card dismissed after the pointer leaves ===')
await page.mouse.move(5, 5)
await sleep(1500)
const after = await page.evaluate(() => {
  const el = document.querySelector('.mic')
  const r = el?.getBoundingClientRect()
  return { present: !!el, h: r ? Math.round(r.height) : 0 }
})
console.log(`  ${JSON.stringify(after)}`)
chk('card is dismissed after the pointer leaves', !after.present || after.h === 0, JSON.stringify(after))

chk('no unexpected JS errors', jsErrs.filter((e) => !/403|Failed to load resource/.test(e)).length === 0, jsErrs.slice(0, 2).join(' | '))
await browser.close()
console.log(`\n=== SUMMARY: PASS ${pass.length} / FAIL ${fail.length} ===`)
if (fail.length) {
  fail.forEach((f) => console.log(`  FAILED: ${f}`))
  process.exit(1)
}