import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto('http://localhost:8848/#/login', { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(3000);
const loginHtml = await p.locator('.login-page-container').innerHTML();
console.log('login container (first 3000):', loginHtml.substring(0, 3000));
await b.close();
