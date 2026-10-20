import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto('http://localhost:8848/#/login', { waitUntil: 'load', timeout: 15000 });
await p.waitForSelector('.login-page-container', { timeout: 15000 });
await p.waitForTimeout(3000);
// Find inputs with their parent context
const allInputs = await p.locator('.login-page-container input').evaluateAll(els => els.map(e => ({
  type: e.type, placeholder: e.placeholder, name: e.name, autocomplete: e.autocomplete,
  parent: e.parentElement?.className || ''
})));
console.log('login inputs:', JSON.stringify(allInputs, null, 2));
// Try different selectors
const userInput = await p.locator('.login-page-container input[placeholder*="用户"]').count();
console.log('user inputs found:', userInput);
const pwdInput = await p.locator('.login-page-container input[type="password"]').count();
console.log('pwd inputs found:', pwdInput);
const anyInput = await p.locator('.login-page-container input').count();
console.log('any inputs:', anyInput);
// Get the form HTML
const formHtml = await p.locator('.login-page-container').innerHTML();
const idx = formHtml.indexOf('用户');
if (idx >= 0) console.log('\nContext around 用户:\n', formHtml.substring(Math.max(0, idx - 100), idx + 200));
const idx2 = formHtml.indexOf('password');
if (idx2 >= 0) console.log('\nContext around password:\n', formHtml.substring(Math.max(0, idx2 - 100), idx2 + 200));
await b.close();
