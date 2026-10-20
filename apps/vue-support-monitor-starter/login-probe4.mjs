import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
p.on('console', msg => { if (msg.text().includes('error') || msg.text().includes('Error')) console.log('CONSOLE ERROR:', msg.text().substring(0, 200)); });
await p.goto('http://localhost:8848/#/login', { waitUntil: 'load', timeout: 15000 });
// Wait for Vue to render
try {
  await p.waitForSelector('.login-page-container', { timeout: 15000 });
  console.log('login container found');
  await p.waitForTimeout(3000);
  const loginHtml = await p.locator('.login-page-container').innerHTML();
  console.log('login container HTML (first 4000):\n', loginHtml.substring(0, 4000));
} catch(e) {
  console.log('ERROR:', e.message);
  const body = await p.locator('body').innerHTML();
  console.log('body:', body.substring(0, 2000));
}
await b.close();
