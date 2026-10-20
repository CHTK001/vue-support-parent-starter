/**
 * 临时调试：追踪第二次上传（filechooser.setFiles）为何没有发出请求。
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'http://localhost:15689'
const PASS = 'admin123'
const OUT = path.join(os.tmpdir(), 'dsh-colorize-accept')
const grayPath = path.join(OUT, 'gray.png')
const PNG = Buffer.from(
  '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',
  'base64',
)

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
const page = await context.newPage()
page.on('request', (r) => {
  if (r.url().includes('colorize')) console.log('REQ', r.method(), r.url())
})
page.on('response', (r) => {
  if (r.url().includes('colorize')) console.log('RESP', r.status(), r.url())
})
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE-ERR', m.text().slice(0, 200))
})
page.on('pageerror', (e) => console.log('PAGE-ERR', String(e).slice(0, 200)))

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.locator('input[type="text"]').first().fill('admin')
await page.locator('input[type="password"]').first().fill(PASS)
await page.keyboard.press('Enter')
await page.waitForFunction(() => !location.pathname.startsWith('/login'), null, { timeout: 90000 })

await page.goto(`${BASE}/image-colorize`, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForSelector('text=点击或拖拽上传图片', { timeout: 60000 })
console.log('BEFORE inputs=', await page.locator('input[type=file]').count())
await page.locator('input[type=file]').setInputFiles(grayPath)
await page.waitForTimeout(4000)
console.log('AFTER-REAL result=', await page.locator('img[alt="上色结果"]').count(), 'failText=', await page.locator('text=上色失败').count())

let captured = 0
await page.route('**/v2/ai/colorize/upload', async (route) => {
  captured++
  console.log('ROUTE-HIT', route.request().method(), route.request().url())
  await route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
})

const btn = page.locator('button', { hasText: '更换图片' }).first()
console.log('BTN count=', await btn.count(), 'enabled=', await btn.isEnabled())
const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), btn.click()])
console.log('CHOOSER', !!chooser, 'multiple=', chooser.isMultiple())
await chooser.setFiles(grayPath)
await page.waitForTimeout(5000)
console.log('ROUTE-HITS=', captured)
console.log('FILES=', await page.evaluate(() => Array.from(document.querySelectorAll('input[type=file]')).map((i) => i.files ? i.files.length : -1)))
console.log('RESULT=', await page.locator('img[alt="上色结果"]').count(), 'ERRTEXT=', await page.locator('text=上色失败').count())
await page.screenshot({ path: path.join(OUT, 'debug-second-upload.png'), fullPage: true })
await browser.close()
