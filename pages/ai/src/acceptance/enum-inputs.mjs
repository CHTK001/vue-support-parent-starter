import { chromium } from 'playwright'

const browser = await chromium.launch({ browserName: 'firefox' })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const BASE = 'http://localhost:15689'
const PASS = 'admin123'

// login
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.locator('input[type="text"]').first().fill('admin')
await page.locator('input[type="password"]').first().fill(PASS)
await page.keyboard.press('Enter')
await page.waitForFunction(() => !location.pathname.startsWith('/login'), null, { timeout: 60000 })
await page.waitForTimeout(2000)

// go to settings / 默认模型
await page.goto(`${BASE}/setting`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2000)

const dmTab = page.locator('*').filter({ hasText: /^默认模型$/ }).first()
await dmTab.click({ force: true })
await page.waitForTimeout(3000)

// Find all input[readonly] that are model selectors (not number inputs)
// Number inputs have stepper buttons, model inputs don't
const allInputs = page.locator('input[readonly]')
const count = await allInputs.count()
console.log(`Total input[readonly]: ${count}`)

for (let i = 0; i < Math.min(count, 10); i++) {
    const inp = allInputs.nth(i)
    const val = await inp.inputValue().catch(() => '')
    const parent = inp.locator('xpath=ancestor::*[contains(@class,"setting-row") or contains(@class,"vs-opt")][1]')
    const parentExists = await parent.count() > 0
    let label = ''
    if (parentExists) {
        const spans = await parent.locator('span').allTextContents().catch(() => [])
        label = spans.join('|').trim().slice(0, 60)
    }
    console.log(`  [${i}] val="${val}" label="${label}"`)
}

await browser.close()
