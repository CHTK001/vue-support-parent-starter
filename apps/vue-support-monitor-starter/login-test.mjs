import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto('http://localhost:8848/#/login', { waitUntil: 'load', timeout: 15000 });
// Wait for Vue to render like global-setup does
const user = p.locator('input[placeholder*="用户名"]').first();
const pwd = p.locator('input[type="password"]').first();
await user.waitFor({ state: 'visible', timeout: 120000 });
console.log('user input visible');
await pwd.waitFor({ state: 'visible', timeout: 120000 });
console.log('pwd input visible');
await user.fill('admin');
await pwd.fill('admin123');
const loginBtn = p.getByRole('button', { name: /登录/ }).first();
await loginBtn.click();
console.log('login clicked');
// Wait to leave /login
await p.waitForFunction(() => !location.hash.includes('/login'), { timeout: 60000 });
console.log('left login page - logged in');
await b.close();
