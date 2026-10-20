import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
// intercept requests to understand what's happening
const responses = [];
p.on('response', r => { if (r.url().includes('login')) responses.push({ url: r.url(), status: r.status() }); });
await p.goto('http://localhost:8848/#/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
await p.waitForTimeout(5000);
const bodyHtml = await p.locator('body').innerHTML();
console.log('body (first 2000):', bodyHtml.substring(0, 2000));
const allHtml = await p.content();
console.log('\n=== page content length:', allHtml.length, '===');
// Check for Vue app mount
const appEl = await p.locator('#app').innerHTML();
console.log('\n#app content (first 1000):', appEl.substring(0, 1000));
await b.close();
