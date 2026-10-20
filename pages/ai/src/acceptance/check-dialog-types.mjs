import { chromium } from 'playwright'

const browser = await chromium.launch({ browserName: 'firefox' })
const page = await browser.newPage()
const BASE = 'http://localhost:15689'
const PASS = 'admin123'

// login
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.locator('input[type="text"]').first().fill('admin')
await page.locator('input[type="password"]').first().fill(PASS)
await page.keyboard.press('Enter')
await page.waitForFunction(() => !location.pathname.startsWith('/login'), null, { timeout: 60000 })
await page.waitForTimeout(2000)

// go to settings
await page.goto(`${BASE}/setting`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)

// Click 默认模型 tab
const dmTab = page.locator('*').filter({ hasText: /^默认模型$/ }).first()
await dmTab.click({ force: true })
await page.waitForTimeout(3000)

// Check ALL elements containing "对话"
const chatElements = page.locator('*').filter({ hasText: '对话' })
const count = await chatElements.count()
console.log(`Elements with "对话": ${count}`)
for (let i = 0; i < Math.min(count, 10); i++) {
    const el = chatElements.nth(i)
    const tag = await el.evaluate(e => e.tagName)
    const cls = await el.getAttribute('class').catch(() => '')
    const txt = await el.textContent().catch(() => '')
    console.log(`  [${i}] tag=${tag} class="${cls.slice(0,60)}" text="${txt.trim().slice(0,50)}"`)
}

// Check ALL elements containing model-related text
const modelElements = page.locator('*').filter({ hasText: /模型|对话|图片|语音|Agent/ })
const mcount = await modelElements.count()
console.log(`\nElements with model keywords: ${mcount}`)
for (let i = 0; i < Math.min(mcount, 15); i++) {
    const el = modelElements.nth(i)
    const tag = await el.evaluate(e => e.tagName)
    const cls = await el.getAttribute('class').catch(() => '')
    const txt = await el.textContent().catch(() => '')
    const id = await el.getAttribute('id').catch(() => '')
    console.log(`  [${i}] tag=${tag} class="${cls.slice(0,50)}" id="${id}" text="${txt.trim().slice(0,40)}"`)
}

// List all rows
console.log('\nAll .setting-row:')
const rows = page.locator('.setting-row')
const rc = await rows.count()
console.log(`Count: ${rc}`)
for (let i = 0; i < Math.min(rc, 10); i++) {
    const row = rows.nth(i)
    const html = await row.innerHTML().catch(() => 'N/A')
    const texts = await row.locator('span, label').allTextContents().catch(() => [])
    console.log(`  [${i}] ${texts.slice(0,5).join('|').slice(0,80)}`)
}

// Check all vs-opt-row
console.log('\nAll .vs-opt-row:')
const vrows = page.locator('.vs-opt-row')
const vrc = await vrows.count()
console.log(`Count: ${vrc}`)

// Try clicking input[readonly][0] and check dialog type
console.log('\nTrying input[readonly][0]:')
const inp0 = page.locator('input[readonly]').nth(0)
await inp0.click({ force: true })
await page.waitForTimeout(3000)
const dialogVisible = await page.locator('.el-dialog__wrapper:visible, [role="dialog"]:visible').count()
console.log(`Dialog visible: ${dialogVisible > 0}`)
if (dialogVisible > 0) {
    const emptyText = await page.locator('.md-empty-main').textContent().catch(() => 'N/A')
    console.log(`Empty text: ${emptyText}`)
}
await page.keyboard.press('Escape')
await page.waitForTimeout(1000)

console.log('\nTrying input[readonly][2]:')
const inp2 = page.locator('input[readonly]').nth(2)
await inp2.click({ force: true })
await page.waitForTimeout(3000)
const dialogVisible2 = await page.locator('.el-dialog__wrapper:visible, [role="dialog"]:visible').count()
console.log(`Dialog visible: ${dialogVisible2 > 0}`)
if (dialogVisible2 > 0) {
    const emptyText2 = await page.locator('.md-empty-main').textContent().catch(() => 'N/A')
    console.log(`Empty text: ${emptyText2}`)
}
await page.keyboard.press('Escape')
await page.waitForTimeout(1000)

console.log('\nTrying input[readonly][3]:')
const inp3 = page.locator('input[readonly]').nth(3)
await inp3.click({ force: true })
await page.waitForTimeout(3000)
const dialogVisible3 = await page.locator('.el-dialog__wrapper:visible, [role="dialog"]:visible').count()
console.log(`Dialog visible: ${dialogVisible3 > 0}`)
if (dialogVisible3 > 0) {
    const emptyText3 = await page.locator('.md-empty-main').textContent().catch(() => 'N/A')
    console.log(`Empty text: ${emptyText3}`)
    // Check if there are model rows
    const mdRows = await page.locator('.md-row').count()
    console.log(`Model rows: ${mdRows}`)
    if (mdRows > 0) {
        const mdName = await page.locator('.md-name').first().textContent().catch(() => 'N/A')
        console.log(`First model name: ${mdName}`)
    }
}
await page.keyboard.press('Escape')

await browser.close()
